import { db } from "@ocean-dataview/db";
import { product } from "@ocean-dataview/db/schema/product";
import {
	getCursorParams,
	productSearchParamsSchema,
} from "@ocean-dataview/shared/types";
import { and, asc, count, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "../index";
import { buildWhere } from "../lib/filter-columns";

export const productRouter = router({
	getMany: publicProcedure
		.input(productSearchParamsSchema)
		.query(async ({ input }) => {
			const { cursor, limit, filter, sort, search } = input;
			const { after, before } = getCursorParams(cursor ?? undefined);

			const searchWhere = buildWhere(product, search ?? null);
			const filterWhere = buildWhere(product, filter ?? null);
			const advancedWhere = and(searchWhere, filterWhere);

			// Determine direction - cursor is just the ID string
			const isBackward = !!before;
			const cursorId = before || after;

			// Build sort columns with `id` as final tiebreaker for stable pagination
			// The `id` tiebreaker follows the same direction as the primary sort field
			const sortColumns =
				sort && sort.length > 0
					? [
							...sort,
							{ propertyId: "id" as const, desc: sort[0]?.desc ?? true },
						]
					: [
							{ propertyId: "createdAt" as const, desc: true },
							{ propertyId: "id" as const, desc: true },
						];

			// Build cursor condition: compare (col1, col2, ..., id) tuples
			let cursorCondition: ReturnType<typeof sql> | undefined;
			if (cursorId) {
				// Current row's sort column values
				const rowValues = sortColumns.map((col) => product[col.propertyId]);

				// Cursor row's sort column values (fetched via subquery)
				// Use column.name to get the actual DB column name (e.g., "created_at" not "createdAt")
				const cursorValues = sortColumns.map((col) => {
					const columnName = product[col.propertyId].name;
					return sql`(SELECT ${sql.identifier(columnName)} FROM "product" WHERE "id" = ${cursorId})`;
				});

				// When direction matches sort order, use ">"; otherwise "<"
				const isDesc = sortColumns[0]?.desc ?? true;
				const operator = isBackward === isDesc ? sql.raw(">") : sql.raw("<");

				cursorCondition = sql`(${sql.join(rowValues, sql`, `)}) ${operator} (${sql.join(cursorValues, sql`, `)})`;
			}

			const where = and(advancedWhere, cursorCondition);

			// Build ORDER BY clause from sort columns
			let orderBy = sortColumns.map((col) =>
				col.desc ? desc(product[col.propertyId]) : asc(product[col.propertyId])
			);

			// For backward navigation, reverse sort order (results are reversed after fetch)
			if (isBackward) {
				orderBy = sortColumns.map((col) =>
					col.desc
						? asc(product[col.propertyId])
						: desc(product[col.propertyId])
				);
			}

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
