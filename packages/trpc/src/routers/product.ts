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
import { buildGroupBy, buildGroupWhere } from "../lib/group-columns";
import { buildCursor } from "../lib/sort-columns";

// Property configs for grouping (status needs group structure)
const productPropertyConfigs = {
  availability: {
    type: "status" as const,
    config: {
      groups: [
        { label: "Available", color: "green", options: ["In stock"] },
        { label: "Warning", color: "yellow", options: ["Low stock"] },
        { label: "Unavailable", color: "red", options: ["Out of stock"] },
      ],
    },
  },
  category: { type: "select" as const },
  featured: { type: "checkbox" as const },
  lastRestocked: { type: "date" as const },
  price: { type: "number" as const },
  productName: { type: "text" as const },
  tags: { type: "multiSelect" as const },
};

export const productRouter = router({
  getMany: publicProcedure
    .input(productSearchParamsSchema)
    .query(async ({ input }) => {
      const {
        cursors,
        cursor: simpleCursor,
        limit,
        filter,
        sort,
        search,
      } = input;
      // Extract cursor: prefer cursors (unified), fall back to simple cursor (infinite)
      const UNGROUPED_KEY = "__ungrouped__";
      const cursorValue = cursors?.[UNGROUPED_KEY] ?? simpleCursor;
      const { after, before } = getCursorParams(cursorValue);

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
   */
  getGroup: publicProcedure
    .input(
      z.object({
        groupBy: groupByConfigSchema,
      })
    )
    .query(async ({ input }) => {
      const { groupBy } = input;
      const parsed = parseGroupByConfig(groupBy);
      const propertyConfig =
        productPropertyConfigs[
          parsed.property as keyof typeof productPropertyConfigs
        ];

      // Build SQL GROUP BY expression
      const groupByResult = buildGroupBy(product, parsed, propertyConfig);
      if (!groupByResult) {
        return { counts: {}, sortValues: {} };
      }

      const { groupKey, orderBy } = groupByResult;

      // Execute SQL GROUP BY query
      const results = await db
        .select({
          groupKey,
          sortValue: orderBy,
          count: count(),
        })
        .from(product)
        .groupBy(groupKey, orderBy)
        .orderBy(orderBy);

      // Build counts with sortValues
      const counts: Record<string, { count: number; hasMore: boolean }> = {};
      const sortValues: Record<string, string | number> = {};

      for (const row of results) {
        // Convert Date to ISO string for proper serialization
        const key =
          row.groupKey instanceof Date
            ? row.groupKey.toISOString()
            : String(row.groupKey ?? `No ${parsed.property}`);
        counts[key] = {
          count: Math.min(Number(row.count), 100),
          hasMore: Number(row.count) > 100,
        };
        sortValues[key] =
          typeof row.sortValue === "number"
            ? row.sortValue
            : String(row.sortValue ?? key);
      }

      return { counts, sortValues };
    }),

  /**
   * Get items grouped by a property with per-group pagination.
   * Supports full GroupByConfig for complex grouping strategies.
   * Same response shape as getMany but with per-group Records.
   * Counts handled separately by getGroup procedure.
   */
  getManyByGroup: publicProcedure
    .input(
      z.object({
        groupBy: groupByConfigSchema,
        limit: z.number().int().min(1).max(100).default(10),
        cursor: z.record(z.string(), z.string().nullable()).optional(),
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
        // Group keys to fetch - required for knowing which groups to load
        groupKeys: z.array(z.string()).optional(),
      })
    )
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Loop with cursor handling requires conditionals
    .query(async ({ input }) => {
      const {
        groupBy,
        limit,
        cursor: inputCursors = {},
        filter,
        sort,
        search,
        groupKeys: requestedGroupKeys,
      } = input;

      // Parse the GroupByConfig
      const parsed = parseGroupByConfig(groupBy);
      const propertyConfig =
        productPropertyConfigs[
          parsed.property as keyof typeof productPropertyConfigs
        ];

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

      // Determine which groups to fetch
      let groupKeysToFetch: string[];

      if (requestedGroupKeys && requestedGroupKeys.length > 0) {
        // Use explicitly requested group keys
        groupKeysToFetch = requestedGroupKeys;
      } else {
        // Get distinct groups using buildGroupBy for transformed keys
        const groupByResult = buildGroupBy(product, parsed, propertyConfig);

        if (!groupByResult) {
          return {
            items: [],
            startCursor: {},
            endCursor: {},
            hasNextPage: {},
            hasPreviousPage: {},
          };
        }

        const { groupKey, orderBy } = groupByResult;

        const groupsResult = await db
          .selectDistinct({ groupKey, sortValue: orderBy })
          .from(product)
          .where(and(filterWhere, searchWhere))
          .orderBy(orderBy);

        groupKeysToFetch = groupsResult.map((r) =>
          String(r.groupKey ?? `No ${parsed.property}`)
        );
      }

      // Fetch items for each group
      const allItems: (typeof product.$inferSelect)[] = [];
      const startCursor: Record<string, string | null> = {};
      const endCursor: Record<string, string | null> = {};
      const hasNextPage: Record<string, boolean> = {};
      const hasPreviousPage: Record<string, boolean> = {};
      const seenIds = new Set<number>();

      for (const groupKey of groupKeysToFetch) {
        const cursor = inputCursors[groupKey];

        // Skip exhausted/empty groups (cursor === null means "don't refetch")
        if (cursor === null) {
          startCursor[groupKey] = null;
          endCursor[groupKey] = null;
          hasNextPage[groupKey] = false;
          hasPreviousPage[groupKey] = true;
          continue;
        }

        // Build group WHERE using buildGroupWhere
        const groupWhere = buildGroupWhere(
          product,
          parsed,
          groupKey,
          propertyConfig
        );

        if (!groupWhere) {
          continue;
        }

        // Build cursor WHERE for this group
        const { orderBy, cursorWhere } = buildCursor(product, {
          sort: sortWithTiebreaker,
          cursor,
          direction: "forward",
        });

        // Fetch with limit + 1 to check hasMore
        const data = await db.query.product.findMany({
          where: and(filterWhere, searchWhere, cursorWhere, groupWhere),
          orderBy,
          limit: limit + 1,
        });

        const hasMore = data.length > limit;
        const items = hasMore ? data.slice(0, -1) : data;
        const firstItem = items[0];
        const lastItem = items.at(-1);

        // Track cursors (forward-only pagination for Load More)
        startCursor[groupKey] = firstItem ? String(firstItem.id) : null;
        endCursor[groupKey] = lastItem ? String(lastItem.id) : null;
        hasNextPage[groupKey] = hasMore;
        hasPreviousPage[groupKey] = !!cursor;

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
