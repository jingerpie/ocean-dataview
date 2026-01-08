"use client";

import {
	BoardSkeleton,
	BoardView,
} from "@ocean-dataview/dataview/components/data-views/board-view";
import { DataViewOptions } from "@ocean-dataview/dataview/components/data-views/shared/data-view-options";
import { DataViewProvider } from "@ocean-dataview/dataview/components/data-views/shared/data-view-provider";
import { useGroupPagination } from "@ocean-dataview/dataview/lib/data-views/hooks";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { GroupPaginationTabs } from "../group-pagination/group-pagination-tabs";
import {
	type Product,
	productProperties,
} from "../group-pagination/product-properties";

/**
 * BoardView with server-side pagination
 *
 * Unlike Table/List/Gallery, BoardView columns are always visible (no accordion).
 * All group keys are passed to useGroupPagination so all columns fetch data.
 */
export const ProductGroupPaginationBoard = () => (
	<Suspense fallback={<BoardSkeleton columnCount={4} />}>
		<ProductGroupPaginationBoardView />
	</Suspense>
);

const ProductGroupPaginationBoardView = () => {
	const trpc = useTRPC();

	// 1. Fetch group counts
	const { data: groupCounts, error: groupError } = useQuery(
		trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" }),
	);

	// 2. All columns need data - no useGroupExpansion needed for BoardView
	// All group keys are "expanded" so all columns fetch data
	const allGroupKeys = Object.keys(groupCounts || {});

	// 3. Pagination with declarative query options
	const { data, pagination } = useGroupPagination<Product>({
		expandedGroups: allGroupKeys, // All columns fetch data (always "expanded")
		counts: groupCounts,
		groupBy: "familyGroup",
		createQueryOptions: (groupKey, after, before, limit) =>
			trpc.product.getMany.queryOptions({
				filters: [
					{
						propertyId: "familyGroup",
						operator: "eq",
						value: groupKey,
						variant: "select",
						filterId: "familyGroup-group",
					},
				],
				sort: [{ propertyId: "updatedAt", desc: false }],
				after,
				before,
				limit,
			}),
	});

	// Empty state (covers errors and empty results)
	const isEmpty = pagination.groups.length === 0;

	if (groupError || isEmpty) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<p className="text-muted-foreground">No products found</p>
			</div>
		);
	}

	return (
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
				}}
				counts={groupCounts}
				pagination="page"
			/>
		</DataViewProvider>
	);
};
