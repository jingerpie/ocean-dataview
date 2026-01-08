"use client";

import {
	BoardSkeleton,
	BoardView,
} from "@ocean-dataview/dataview/components/data-views/board-view";
import { DataViewOptions } from "@ocean-dataview/dataview/components/data-views/shared/data-view-options";
import { DataViewProvider } from "@ocean-dataview/dataview/components/data-views/shared/data-view-provider";
import { useGroupInfinitePagination } from "@ocean-dataview/dataview/lib/data-views/hooks";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { GroupPaginationTabs } from "../group-pagination/group-pagination-tabs";
import {
	type Product,
	productProperties,
} from "../group-pagination/product-properties";

interface Props {
	limit: number;
}

/**
 * BoardView with infinite load-more pagination
 *
 * Unlike Table/List/Gallery, BoardView columns are always visible (no accordion).
 * All group keys are always "expanded" so all columns fetch data.
 */
export const ProductGroupPaginationBoard = (props: Props) => (
	<Suspense fallback={<BoardSkeleton columnCount={4} />}>
		<ProductGroupPaginationBoardView {...props} />
	</Suspense>
);

const ProductGroupPaginationBoardView = ({ limit }: Props) => {
	const trpc = useTRPC();

	// 1. Fetch group counts
	const { data: groupCounts } = useSuspenseQuery(
		trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" }),
	);

	// 2. Get all group keys
	const allGroupKeys = Object.keys(groupCounts);

	// 3. Single hook call using TRPC infiniteQueryOptions - all groups "expanded" for board
	const { data, pagination } = useGroupInfinitePagination<Product>({
		allGroupKeys,
		expanded: allGroupKeys, // All columns visible
		groupCounts,
		limit,
		createQueryOptions: (groupKey) =>
			trpc.product.getMany.infiniteQueryOptions(
				{
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
					limit,
				},
				{
					getNextPageParam: (lastPage) => lastPage.endCursor ?? undefined,
				},
			),
	});

	// Empty state
	if (pagination.groups.length === 0) {
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
				pagination="loadMore"
			/>
		</DataViewProvider>
	);
};
