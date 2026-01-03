"use client";

import { DataViewOptions } from "@ocean-dataview/dataview/components/data-views/shared/data-view-options";
import { DataViewProvider } from "@ocean-dataview/dataview/components/data-views/shared/data-view-provider";
import { PagePagination } from "@ocean-dataview/dataview/components/data-views/shared/page-pagination";
import { TableView } from "@ocean-dataview/dataview/components/data-views/table-view";
import {
	useGroupExpansion,
	useGroupPagination,
} from "@ocean-dataview/dataview/lib/data-views/hooks";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc/client";
import { GroupPaginationTabs } from "./group-pagination-tabs";
import { type Product, productProperties } from "./product-properties";
/**
 * Listings Table View
 *
 * Uses controlled expansion pattern:
 * 1. useGroupExpansion manages URL state for expanded groups
 * 2. usePagination uses expandedGroups to control which queries are enabled
 * 3. TableView receives controlled expansion props
 */
export const ProductGroupPaginationTable = () => {
	const trpc = useTRPC();

	// 1. Fetch group counts
	const {
		data: groupCounts,
		isLoading: groupLoading,
		error: groupError,
	} = useQuery(trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" }));

	// 2. Expansion state (controlled)
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

	// Loading state
	if (groupLoading && !groupCounts) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<div className="text-center">
					<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
					<p className="text-muted-foreground">Loading products; ...</p>
				</div>
			</div>
		);
	}

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

			<TableView
				view={{
					group: {
						groupBy: "familyGroup",
						showAggregation: true,
						expandedGroups,
						onExpandedChange: handleAccordionChange,
					},
				}}
				layout={{ showVerticalLines: false, wrapAllColumns: false }}
				pagination={(context) => <PagePagination {...context} />}
			/>
		</DataViewProvider>
	);
};
