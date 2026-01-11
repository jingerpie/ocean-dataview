"use client";

import { DataViewOptions } from "@ocean-dataview/dataview/components/ui/tool-bar";
import {
	BoardSkeleton,
	BoardView,
} from "@ocean-dataview/dataview/components/views/board-view";
import { useGroupPagePagination } from "@ocean-dataview/dataview/hooks";
import { DataViewProvider } from "@ocean-dataview/dataview/lib/providers";
import type {
	CursorState,
	PropertyFilter,
	PropertySort,
} from "@ocean-dataview/shared/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { GroupPaginationTabs } from "./group-pagination-tabs";
import { type Product, productProperties } from "./product-properties";

/**
 * Props passed from server (parsed URL params)
 */
interface Props {
	cursors: CursorState[];
	limit: number;
	filters?: PropertyFilter<Product>[];
	sort?: PropertySort<Product>[];
	joinOperator?: "and" | "or";
}

/**
 * BoardView with server-side pagination
 *
 * Unlike Table/List/Gallery, BoardView columns are always visible (no accordion).
 * All group keys are always "expanded" so all columns fetch data.
 */
export function ProductSubGroupPaginationBoard({
	cursors,
	limit,
	filters = [],
	sort = [],
	joinOperator = "and",
}: Props) {
	const trpc = useTRPC();

	// 1. Fetch group counts (suspends until data is ready)
	const { data: groupCounts } = useSuspenseQuery(
		trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" }),
	);

	// 2. Get all group keys - all columns are always visible in BoardView
	const allGroupKeys = Object.keys(groupCounts);

	// 3. Single hook call - creates queries internally using TRPC queryOptions
	const { data, pagination } = useGroupPagePagination({
		allGroupKeys,
		expanded: allGroupKeys, // All columns visible
		cursors,
		groupCounts,
		limit,
		createQueryOptions: (groupKey, cursor) =>
			trpc.product.getMany.queryOptions({
				filters: [
					// Group filter (always applied)
					{
						propertyId: "familyGroup",
						operator: "eq",
						value: groupKey,
						variant: "select",
						filterId: "familyGroup-group",
					},
					// User filters from URL
					...filters,
				],
				sort,
				cursor,
				limit,
				joinOperator,
			}),
	});

	// Empty state
	if (pagination.groups.length === 0) {
		return (
			<div className="flex min-h-100 items-center justify-center">
				<p className="text-muted-foreground">No products found</p>
			</div>
		);
	}

	return (
		<Suspense fallback={<BoardSkeleton columnCount={4} />}>
			<DataViewProvider
				data={data}
				properties={productProperties}
				pagination={pagination}
			>
				<div className="flex items-center justify-between">
					<GroupPaginationTabs />
					<DataViewOptions />
				</div>

				<BoardView
					view={{
						group: { groupBy: "familyGroup", showAggregation: true },
						subGroup: { subGroupBy: "tag" },
					}}
					counts={groupCounts}
					pagination="page"
				/>
			</DataViewProvider>
		</Suspense>
	);
}
