"use client";

import { NotionToolbar } from "@ocean-dataview/dataview/components/ui";
import {
	BoardSkeleton,
	BoardView,
} from "@ocean-dataview/dataview/components/views/board-view";
import { useGroupInfinitePagination } from "@ocean-dataview/dataview/hooks";
import { DataViewProvider } from "@ocean-dataview/dataview/lib/providers";
import type { PropertySort, WhereNode } from "@ocean-dataview/shared/types";
import { combineGroupFilter } from "@ocean-dataview/shared/utils";
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
	filter?: WhereNode | null;
	/** Search filter (converted from URL ?search=xxx by server page) */
	search?: WhereNode | null;
	sort?: PropertySort<Product>[];
}

/**
 * BoardView with infinite load-more pagination
 *
 * Unlike Table/List/Gallery, BoardView columns are always visible (no accordion).
 * All group keys are always "expanded" so all columns fetch data.
 */
export function ProductGroupPaginationBoard({
	limit,
	filter = null,
	search: searchQuery = null,
	sort = [],
}: Props) {
	const trpc = useTRPC();

	// 1. Fetch group counts
	const { data: groupCounts } = useSuspenseQuery(
		trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" })
	);

	// 2. Get all group keys
	const allGroupKeys = Object.keys(groupCounts);

	// 3. Single hook call using TRPC infiniteQueryOptions - all groups "expanded" for board
	const { data, pagination } = useGroupInfinitePagination({
		allGroupKeys,
		expanded: allGroupKeys, // All columns visible
		groupCounts,
		limit,
		createQueryOptions: (groupKey) =>
			trpc.product.getMany.infiniteQueryOptions(
				{
					filter: combineGroupFilter("familyGroup", groupKey, filter),
					search: searchQuery,
					sort,
					limit,
				},
				{
					getNextPageParam: (lastPage) => lastPage.endCursor ?? undefined,
				}
			),
	});

	return (
		<Suspense fallback={<BoardSkeleton columnCount={4} />}>
			<DataViewProvider
				data={data}
				pagination={pagination}
				properties={productProperties}
			>
				{/* Uncontrolled mode: NotionToolbar manages state via nuqs */}
				<NotionToolbar properties={productProperties}>
					<GroupPaginationTabs />
				</NotionToolbar>

				{pagination.groups.length === 0 ? (
					<div className="flex min-h-100 items-center justify-center">
						<p className="text-muted-foreground">No products found</p>
					</div>
				) : (
					<BoardView
						counts={groupCounts}
						pagination="loadMore"
						view={{
							group: { groupBy: "familyGroup", showAggregation: true },
						}}
					/>
				)}
			</DataViewProvider>
		</Suspense>
	);
}
