"use client";

import { DataViewOptions } from "@ocean-dataview/dataview/components/data-views/shared/data-view-options";
import { DataViewProvider } from "@ocean-dataview/dataview/components/data-views/shared/data-view-provider";
import {
	TableSkeleton,
	TableView,
} from "@ocean-dataview/dataview/components/data-views/table-view";
import { useGroupPagePagination } from "@ocean-dataview/dataview/lib/data-views/hooks";
import type { CursorState } from "@ocean-dataview/shared/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { GroupPaginationTabs } from "./group-pagination-tabs";
import { productProperties } from "./product-properties";

const DEFAULT_EXPANDED: string[] = [];

/**
 * Props passed from server (parsed URL params)
 */
interface Props {
	expanded: string[] | null;
	cursors: CursorState[];
	limit: number;
}

/**
 * Product Group Table with cursor-based pagination.
 *
 * Pattern: Server prefetch → Props → Client uses props for query
 * - Server parses URL, prefetches group counts, passes props
 * - Client uses useSuspenseQuery for group counts (matches server prefetch)
 * - Client uses useQueries with enabled flag for group data
 * - useGroupPagePagination builds data + pagination + handleAccordionChange
 */
export const ProductGroupPaginationTable = (props: Props) => (
	<Suspense fallback={<TableSkeleton columnCount={5} rowCount={10} />}>
		<ProductGroupPaginationTableView {...props} />
	</Suspense>
);

const ProductGroupPaginationTableView = ({
	expanded: expandedProp,
	cursors,
	limit,
}: Props) => {
	const trpc = useTRPC();

	// 1. Group counts (Suspense OK - matches server prefetch)
	const { data: groupCounts } = useSuspenseQuery(
		trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" }),
	);

	// 2. Apply default on client
	const expanded = expandedProp ?? DEFAULT_EXPANDED;

	// 3. Get all group keys (stable order)
	const allGroupKeys = Object.keys(groupCounts);

	// 4. Single hook call - creates queries internally using TRPC queryOptions
	const { data, pagination, handleAccordionChange } = useGroupPagePagination({
		allGroupKeys,
		expanded,
		cursors,
		groupCounts,
		limit,
		createQueryOptions: (groupKey, { after, before }) =>
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

			<TableView
				view={{
					group: {
						groupBy: "familyGroup",
						showAggregation: true,
						expandedGroups: expanded,
						onExpandedChange: handleAccordionChange,
					},
				}}
				layout={{ showVerticalLines: false, wrapAllColumns: false }}
				pagination="page"
			/>
		</DataViewProvider>
	);
};
