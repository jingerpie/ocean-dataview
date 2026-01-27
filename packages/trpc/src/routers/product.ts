import { db } from "@ocean-dataview/db";
import { product } from "@ocean-dataview/db/schema/product";
import {
  getCursorParams,
  productSearchParamsSchema,
} from "@ocean-dataview/shared/types";
import { and, count, desc } from "drizzle-orm";
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

      // Prepare sort with tiebreaker (uses last field's direction)
      const sortWithTiebreaker: typeof sort =
        sort && sort.length > 0
          ? [
              ...sort,
              {
                property: "id",
                direction: "desc",
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
        channelId: z.string().optional(),
        groupBy: z.enum(["type", "familyGroup"]),
        subGroupBy: z.enum(["type", "familyGroup", "tag"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const { groupBy, subGroupBy } = input;

      const groupByColumn = product[groupBy];

      // Two-level grouping (for BoardView sub-groups)
      if (subGroupBy) {
        const subGroupByColumn = product[subGroupBy];

        const groupedCounts = await db
          .select({
            group: groupByColumn,
            subGroup: subGroupByColumn,
            count: count(),
          })
          .from(product)
          .groupBy(groupByColumn, subGroupByColumn)
          .orderBy(desc(count()));

        // Transform into nested structure
        const result: Record<
          string,
          {
            count: number;
            hasMore: boolean;
            subGroups: Record<string, { count: number; hasMore: boolean }>;
          }
        > = {};

        for (const { group, subGroup, count: c } of groupedCounts) {
          const groupKey = String(group ?? "null");
          const subGroupKey = String(subGroup ?? "null");

          if (!result[groupKey]) {
            result[groupKey] = { count: 0, hasMore: false, subGroups: {} };
          }
          result[groupKey].count += c;
          result[groupKey].hasMore = result[groupKey].count >= 100;
          result[groupKey].subGroups[subGroupKey] = {
            count: Math.min(c, 100),
            hasMore: c >= 100,
          };
        }

        return result;
      }

      // Single-level grouping (existing logic)
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
          hasMore: groupCount >= 100,
        };
      }

      return result;
    }),
});
