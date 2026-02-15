import { db } from "@sparkyidea/db";
import { product } from "@sparkyidea/db/schema/product";
import {
  getCursorParams,
  productSearchParamsSchema,
  searchQuerySchema,
  whereNodeSchema,
} from "@sparkyidea/shared/types";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "../index";
import { buildWhere } from "../lib/filter-columns";
import { buildCursor } from "../lib/sort-columns";

export const productRouter = router({
  getMany: publicProcedure
    .input(productSearchParamsSchema)
    .query(async ({ input }) => {
      const { cursor, limit, filter, sort, search } = input;
      const { after, before } = getCursorParams(cursor ?? undefined);

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
        nextCursor: hasMoreInDirection && !isBackward ? endCursor : null, // Backwards compat
        hasNextPage: isBackward ? true : hasMoreInDirection,
        hasPreviousPage: isBackward ? hasMoreInDirection : !!after,
      };
    }),

  getGroup: publicProcedure
    .input(
      z.object({
        groupBy: z.enum(["category", "availability"]),
      })
    )
    .query(async ({ input }) => {
      const { groupBy } = input;
      const groupByColumn = product[groupBy];

      const groupedCounts = await db
        .select({
          group: groupByColumn,
          count: count(),
        })
        .from(product)
        .groupBy(groupByColumn)
        .orderBy(desc(count()));

      // Build result with counts capped at 100 and hasMore flag
      const result: Record<string, { count: number; hasMore: boolean }> = {};
      for (const { group, count: groupCount } of groupedCounts) {
        const groupKey = String(group ?? "null");
        result[groupKey] = {
          count: Math.min(groupCount, 100),
          hasMore: groupCount > 100,
        };
      }

      return result;
    }),

  /**
   * Get items grouped by a property with per-group pagination.
   * Same response shape as getMany but with per-group Records.
   * Counts handled separately by getGroup procedure.
   */
  getManyByGroup: publicProcedure
    .input(
      z.object({
        groupBy: z.enum(["category", "availability"]),
        limit: z.number().int().min(1).max(100).default(10),
        cursor: z.record(z.string(), z.string()).optional(),
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
      } = input;
      const groupByColumn = product[groupBy];

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

      // Get distinct groups (counts handled by getGroup procedure)
      const groupsResult = await db
        .selectDistinct({ group: groupByColumn })
        .from(product)
        .where(and(filterWhere, searchWhere));

      // Fetch items for each group
      const allItems: (typeof product.$inferSelect)[] = [];
      const startCursor: Record<string, string | null> = {};
      const endCursor: Record<string, string | null> = {};
      const nextCursor: Record<string, string | null> = {};
      const hasNextPage: Record<string, boolean> = {};
      const hasPreviousPage: Record<string, boolean> = {};
      const seenIds = new Set<number>();

      for (const { group } of groupsResult) {
        const groupKey = String(group ?? "null");
        const cursor = inputCursors[groupKey];
        const groupWhere =
          group === null ? isNull(groupByColumn) : eq(groupByColumn, group);

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
        nextCursor[groupKey] = hasMore ? endCursor[groupKey] : null;
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
        nextCursor,
        hasNextPage,
        hasPreviousPage,
      };
    }),
});
