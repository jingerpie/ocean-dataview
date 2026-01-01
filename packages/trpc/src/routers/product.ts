import { db } from "@ocean-dataview/db";
import { product } from "@ocean-dataview/db/schema/product";
import { productSearchParamsSchema } from "@ocean-dataview/shared/types";
import { and, asc, desc, sql } from "drizzle-orm";
import { publicProcedure, router } from "../index";
import { filterColumns } from "../lib/filter-columns";

export const productRouter = router({
	getMany: publicProcedure
		.input(productSearchParamsSchema)
		.query(async ({ input, ctx }) => {
			const { after, before, limit, filters, sort, joinOperator } = input;

			const advancedWhere = filterColumns({
				table: product,
				filters,
				joinOperator,
			});

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
				col.desc ? desc(product[col.propertyId]) : asc(product[col.propertyId]),
			);

			// For backward navigation, reverse sort order (results are reversed after fetch)
			if (isBackward) {
				orderBy = sortColumns.map((col) =>
					col.desc
						? asc(product[col.propertyId])
						: desc(product[col.propertyId]),
				);
			}

			const data = await db.query.product.findMany({
				with: { variantItems: true },
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

			// Cursors are just IDs - simple strings
			const startCursor = firstItem?.id ?? null;
			const endCursor = lastItem?.id ?? null;

			return {
				items,
				startCursor, // First item's ID (for previous page)
				endCursor, // Last item's ID (for next page)
				nextCursor: hasMoreInDirection && !isBackward ? endCursor : null, // Backwards compat
				hasNextPage: isBackward ? true : hasMoreInDirection,
				hasPreviousPage: isBackward ? hasMoreInDirection : !!after,
			};
		}),
});
