"use client";

import {
	ListSkeleton,
	ListView,
} from "@ocean-dataview/dataview/components/data-views/list-view";
import { DataViewOptions } from "@ocean-dataview/dataview/components/data-views/shared/data-view-options";
import { DataViewProvider } from "@ocean-dataview/dataview/components/data-views/shared/data-view-provider";
import { PagePagination } from "@ocean-dataview/dataview/components/data-views/shared/page-pagination";
import {
	useGroupExpansion,
	useGroupPagination,
} from "@ocean-dataview/dataview/lib/data-views/hooks";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { GroupPaginationTabs } from "./group-pagination-tabs";
import { type Product, productProperties } from "./product-properties";

/**
 * Listings List View
 *
 * Uses controlled expansion pattern:
 * 1. useGroupExpansion manages URL state for expanded groups
 * 2. usePagination uses expandedGroups to control which queries are enabled
 * 3. ListView receives controlled expansion props
 */
export const ProductGroupPaginationList = () => (
	<Suspense fallback={<ListSkeleton rowCount={8} />}>
		<ProductGroupPaginationListView />
	</Suspense>
);

const ProductGroupPaginationListView = () => {
	const trpc = useTRPC();

	// 1. Fetch group counts (suspends until data is ready)
	const { data: groupCounts } = useSuspenseQuery(
		trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" }),
	);

	// 2. Expansion state (controlled via URL)
	const { expandedGroups, handleAccordionChange } = useGroupExpansion({
		defaultExpanded: [],
	});

	// 3. Pagination with declarative query options
	const { data, pagination } = useGroupPagination<Product>({
		expandedGroups,
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

	// Empty state
	const isEmpty = pagination.groups.length === 0;
	if (isEmpty) {
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

			<ListView
				view={{
					group: {
						groupBy: "familyGroup",
						showAggregation: true,
						expandedGroups,
						onExpandedChange: handleAccordionChange,
					},
				}}
				pagination={(context) => <PagePagination {...context} />}
			/>
		</DataViewProvider>
	);
};
