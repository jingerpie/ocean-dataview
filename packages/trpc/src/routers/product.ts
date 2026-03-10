import { db } from "@sparkyidea/db";
import { product } from "@sparkyidea/db/schema/product";
import {
  getCursorParams,
  groupByConfigSchema,
  parseGroupByConfig,
  productSearchParamsSchema,
  searchQuerySchema,
  whereNodeSchema,
} from "@sparkyidea/shared/types";
import { and, count } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "../index";
import { buildWhere } from "../lib/filter-columns";
import {
  buildGroupBy,
  buildGroupCursor,
  buildGroupWhere,
} from "../lib/group-columns";
import { buildCursor } from "../lib/sort-columns";

export const productRouter = router({
  getMany: publicProcedure
    .input(productSearchParamsSchema)
    .query(async ({ input }) => {
      const { cursor, limit, filter, sort, search } = input;
      const { after, before } = getCursorParams(cursor);

      // Build filter/search WHERE
      // search is SearchQuery ({ or: [...] }), wrap in array for buildWhere
      const searchWhere = buildWhere(product, search ? [search] : null);
      const filterWhere = buildWhere(product, filter);

      // Determine pagination direction
      const isBackward = !!before;
      const cursorId = before || after;

      // Prepare sort with tiebreaker (matches primary sort direction for consistent cursor pagination)
      const primaryDirection = sort?.[0]?.direction ?? "desc";
      const sortWithTiebreaker: typeof sort =
        sort && sort.length > 0
          ? [
              ...sort,
              {
                property: "id",
                direction: primaryDirection,
              },
            ]
          : [
              { property: "createdAt", direction: "desc" },
              { property: "id", direction: "desc" },
            ];

      // Build orderBy + cursor WHERE
      const { orderBy, cursorWhere } = buildCursor(product, {
        sort: sortWithTiebreaker,
        cursor: cursorId,
        direction: isBackward ? "backward" : "forward",
      });

      const where = and(filterWhere, searchWhere, cursorWhere);

      const data = await db.query.product.findMany({
        where,
        orderBy,
        limit: limit + 1,
      });

      // Check if there are more items in this direction
      const hasMoreInDirection = data.length > limit;
      let items = hasMoreInDirection ? data.slice(0, -1) : data;

      // For backward navigation, reverse results to maintain consistent order (newest first)
      if (isBackward) {
        items = items.reverse();
      }

      const firstItem = items[0];
      const lastItem = items.at(-1);

      // Cursors are just IDs converted to strings
      const startCursor = firstItem ? String(firstItem.id) : null;
      const endCursor = lastItem ? String(lastItem.id) : null;

      return {
        items,
        startCursor, // First item's ID (for previous page)
        endCursor, // Last item's ID (for next page)
        hasNextPage: isBackward ? true : hasMoreInDirection,
        hasPreviousPage: isBackward ? hasMoreInDirection : !!after,
      };
    }),

  /**
   * Get group counts with full GroupByConfig support.
   * Supports all group strategies: byDate, byStatus, bySelect, byMultiSelect, byCheckbox, byText, byNumber
   * Supports cursor-based pagination for large numbers of groups.
   * Supports sort direction (asc/desc) for group ordering.
   */
  getGroup: publicProcedure
    .input(
      z.object({
        filter: z.array(whereNodeSchema).nullish(),
        groupBy: groupByConfigSchema,
        // Whether to hide groups with 0 items (default: false, add :hideEmpty flag to URL to enable)
        hideEmpty: z.boolean().default(false),
        // Search filter (same as getMany)
        search: searchQuerySchema.nullish(),
        // Sort direction for groups (default: asc)
        sort: z.enum(["asc", "desc"]).optional(),
        // Pagination params
        limit: z.number().int().min(1).max(100).default(25),
        cursor: z.string().nullable().optional(), // Group sortValue to start after
      })
    )
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: cursor + hideEmpty conditionals
    .query(async ({ input }) => {
      const {
        filter,
        groupBy,
        hideEmpty,
        search,
        sort = "asc",
        limit,
        cursor,
      } = input;
      const parsed = parseGroupByConfig(groupBy);

      const groupByResult = buildGroupBy(product, parsed);
      if (!groupByResult) {
        return {
          counts: {},
          sortValues: {},
          nextCursor: null,
          hasNextPage: false,
        };
      }

      const { groupKey, orderBy } = groupByResult;
      const { orderByClause, cursorFilter } = buildGroupCursor({
        orderBy,
        cursor,
        sort,
      });

      // Build filter/search conditions
      const filterCondition = buildWhere(product, filter ?? undefined);
      const searchCondition = buildWhere(product, search ? [search] : null);
      const whereCondition = and(filterCondition, searchCondition);

      // Get paginated distinct values (source of all possible groups)
      const distinctQuery = db
        .selectDistinct({ groupKey, sortValue: orderBy })
        .from(product);
      const distinctResults = cursorFilter
        ? await distinctQuery
            .where(cursorFilter)
            .orderBy(orderByClause)
            .limit(limit + 1)
        : await distinctQuery.orderBy(orderByClause).limit(limit + 1);

      const hasNextPage = distinctResults.length > limit;
      const groups = hasNextPage
        ? distinctResults.slice(0, limit)
        : distinctResults;

      // Get filtered counts
      const countsResult = await db
        .select({ groupKey, count: count() })
        .from(product)
        .where(whereCondition)
        .groupBy(groupKey);

      const countsMap = new Map<string, number>();
      for (const row of countsResult) {
        const key =
          row.groupKey instanceof Date
            ? row.groupKey.toISOString()
            : String(row.groupKey ?? `No ${parsed.property}`);
        countsMap.set(key, Number(row.count));
      }

      // Build output
      const counts: Record<string, { count: number; hasMore: boolean }> = {};
      const sortValues: Record<string, string | number> = {};

      for (const row of groups) {
        const key =
          row.groupKey instanceof Date
            ? row.groupKey.toISOString()
            : String(row.groupKey ?? `No ${parsed.property}`);
        const rawCount = countsMap.get(key) ?? 0;

        // Skip empty groups when hideEmpty is true
        if (hideEmpty && rawCount === 0) {
          continue;
        }

        counts[key] = {
          count: Math.min(rawCount, 100),
          hasMore: rawCount > 100,
        };
        sortValues[key] =
          typeof row.sortValue === "number"
            ? row.sortValue
            : String(row.sortValue ?? key);
      }

      const lastGroup = groups.at(-1);
      const nextCursor =
        hasNextPage && lastGroup
          ? String(lastGroup.sortValue ?? lastGroup.groupKey)
          : null;

      return { counts, sortValues, nextCursor, hasNextPage };
    }),

  /**
   * Get items grouped by column with per-column pagination.
   * Board-specific procedure for column-based grouping.
   * Supports full GroupByConfig for complex grouping strategies.
   * Same response shape as getMany but with per-column Records.
   * Column counts handled separately by getGroup procedure.
   */
  getManyByColumn: publicProcedure
    .input(
      z.object({
        columnBy: groupByConfigSchema,
        limit: z.number().int().min(1).max(100).default(10),
        // Per-column cursor map for board pagination (tRPC requires field name "cursor")
        // Record<columnKey, cursorString | null>
        cursor: z.record(z.string(), z.string().nullable()).default({}),
        filter: z.array(whereNodeSchema).nullish(),
        sort: z
          .array(
            z.object({
              property: z.string(),
              direction: z.enum(["asc", "desc"]),
            })
          )
          .default([]),
        search: searchQuerySchema.nullish(),
        // Column keys to fetch - required for knowing which columns to load
        columnKeys: z.array(z.string()).optional(),
      })
    )
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Loop with cursor handling requires conditionals
    .query(async ({ input }) => {
      const {
        columnBy,
        limit,
        cursor: cursors, // tRPC's infiniteQueryOptions requires the field to be named cursor
        filter,
        sort,
        search,
        columnKeys: requestedColumnKeys,
      } = input;

      // Parse the GroupByConfig for column
      const parsed = parseGroupByConfig(columnBy);

      // Build common WHERE clauses
      const searchWhere = buildWhere(product, search ? [search] : null);
      const filterWhere = buildWhere(product, filter);

      // Prepare sort with tiebreaker
      const primaryDirection = sort?.[0]?.direction ?? "desc";
      const sortWithTiebreaker: typeof sort =
        sort && sort.length > 0
          ? [...sort, { property: "id", direction: primaryDirection }]
          : [
              { property: "createdAt", direction: "desc" },
              { property: "id", direction: "desc" },
            ];

      // Determine which columns to fetch
      let columnKeysToFetch: string[];

      if (requestedColumnKeys && requestedColumnKeys.length > 0) {
        // Use explicitly requested column keys
        columnKeysToFetch = requestedColumnKeys;
      } else {
        // Get distinct columns using buildGroupBy for transformed keys
        const groupByResult = buildGroupBy(product, parsed);

        if (!groupByResult) {
          return {
            items: [],
            startCursor: {},
            endCursor: {},
            hasNextPage: {},
            hasPreviousPage: {},
          };
        }

        const { groupKey: columnKeyExpr, orderBy } = groupByResult;

        const columnsResult = await db
          .selectDistinct({ columnKey: columnKeyExpr, sortValue: orderBy })
          .from(product)
          .where(and(filterWhere, searchWhere))
          .orderBy(orderBy);

        columnKeysToFetch = columnsResult.map((r) =>
          String(r.columnKey ?? `No ${parsed.property}`)
        );
      }

      // Fetch items for each column
      const allItems: (typeof product.$inferSelect)[] = [];
      const startCursor: Record<string, string | null> = {};
      const endCursor: Record<string, string | null> = {};
      const hasNextPage: Record<string, boolean> = {};
      const hasPreviousPage: Record<string, boolean> = {};
      const seenIds = new Set<number>();

      for (const columnKey of columnKeysToFetch) {
        const cursor = cursors[columnKey];

        // Skip exhausted/empty columns (cursor === null means "don't refetch")
        if (cursor === null) {
          startCursor[columnKey] = null;
          endCursor[columnKey] = null;
          hasNextPage[columnKey] = false;
          hasPreviousPage[columnKey] = true;
          continue;
        }

        // Build column WHERE using buildGroupWhere
        const columnWhere = buildGroupWhere(product, parsed, columnKey);

        if (!columnWhere) {
          continue;
        }

        // Build cursor WHERE for this column
        const { orderBy, cursorWhere } = buildCursor(product, {
          sort: sortWithTiebreaker,
          cursor,
          direction: "forward",
        });

        // Fetch with limit + 1 to check hasMore
        const data = await db.query.product.findMany({
          where: and(filterWhere, searchWhere, cursorWhere, columnWhere),
          orderBy,
          limit: limit + 1,
        });

        const hasMore = data.length > limit;
        const items = hasMore ? data.slice(0, -1) : data;
        const firstItem = items[0];
        const lastItem = items.at(-1);

        // Track cursors (forward-only pagination for Load More)
        startCursor[columnKey] = firstItem ? String(firstItem.id) : null;
        endCursor[columnKey] = lastItem ? String(lastItem.id) : null;
        hasNextPage[columnKey] = hasMore;
        hasPreviousPage[columnKey] = !!cursor;

        // Add items, deduping by ID
        for (const item of items) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            allItems.push(item);
          }
        }
      }

      return {
        items: allItems,
        startCursor,
        endCursor,
        hasNextPage,
        hasPreviousPage,
      };
    }),
});
