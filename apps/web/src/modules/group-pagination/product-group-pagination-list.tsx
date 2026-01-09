"use client";

import { DataViewOptions } from "@ocean-dataview/dataview/components/ui/tool-bar";
import {
	ListSkeleton,
	ListView,
} from "@ocean-dataview/dataview/components/views/list-view";
import { useGroupPagePagination } from "@ocean-dataview/dataview/hooks";
import { DataViewProvider } from "@ocean-dataview/dataview/lib/providers";
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
 * Product Group List with cursor-based pagination.
 *
 * Pattern: Server prefetch → Props → Client uses props for query
 */
export const ProductGroupPaginationList = (props: Props) => (
	<Suspense fallback={<ListSkeleton rowCount={8} />}>
		<ProductGroupPaginationListView {...props} />
	</Suspense>
);

const ProductGroupPaginationListView = ({
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

			<ListView
				view={{
					group: {
						groupBy: "familyGroup",
						showAggregation: true,
						expandedGroups: expanded,
						onExpandedChange: handleAccordionChange,
					},
				}}
				pagination="page"
			/>
		</DataViewProvider>
	);
};
