"use client";

import { DataViewOptions } from "@ocean-dataview/dataview/components/ui";
import {
	BoardSkeleton,
	BoardView,
} from "@ocean-dataview/dataview/components/views/board-view";
import { useGroupInfinitePagination } from "@ocean-dataview/dataview/hooks";
import { DataViewProvider } from "@ocean-dataview/dataview/lib/providers";
import type { Filter, PropertySort } from "@ocean-dataview/shared/types";
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
	filter?: Filter | null;
	sort?: PropertySort<Product>[];
}

/**
 * Combines group filter with user filter using AND logic.
 */
function combineFilters(groupKey: string, userFilter: Filter | null): Filter {
	const groupFilter: Filter = {
		property: "familyGroup",
		operator: "eq",
		value: groupKey,
	};

	if (!userFilter) {
		return groupFilter;
	}

	// Combine with AND logic
	return {
		and: [groupFilter, userFilter],
	};
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
	sort = [],
}: Props) {
	const trpc = useTRPC();

	// 1. Fetch group counts
	const { data: groupCounts } = useSuspenseQuery(
		trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" }),
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
					filter: combineFilters(groupKey, filter),
					sort,
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
					}}
					counts={groupCounts}
					pagination="loadMore"
				/>
			</DataViewProvider>
		</Suspense>
	);
}
