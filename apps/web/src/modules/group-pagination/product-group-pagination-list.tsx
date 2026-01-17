"use client";

import { DataViewOptions } from "@ocean-dataview/dataview/components/ui";
import {
	ListSkeleton,
	ListView,
} from "@ocean-dataview/dataview/components/views/list-view";
import { useGroupPagePagination } from "@ocean-dataview/dataview/hooks";
import { DataViewProvider } from "@ocean-dataview/dataview/lib/providers";
import type {
	Cursors,
	PropertySort,
	WhereNode,
} from "@ocean-dataview/shared/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { GroupPaginationTabs } from "./group-pagination-tabs";
import { type Product, productProperties } from "./product-properties";

const DEFAULT_EXPANDED: string[] = [];

/**
 * Combines group filter with user filter using AND logic.
 */
function combineFilters(
	groupKey: string,
	userFilter: WhereNode | null
): WhereNode {
	const groupFilter: WhereNode = {
		property: "familyGroup",
		operator: "eq",
		value: groupKey,
	};

	if (!userFilter) {
		return groupFilter;
	}

	return { and: [groupFilter, userFilter] };
}

/**
 * Props passed from server (parsed URL params)
 */
interface Props {
	expanded: string[] | null;
	cursors: Cursors;
	limit: number;
	filter?: WhereNode | null;
	/** Search query (converted from URL ?search=xxx by server page) */
	search?: WhereNode | null;
	sort?: PropertySort<Product>[];
}

/**
 * Product Group List with cursor-based pagination.
 *
 * Pattern: Server prefetch → Props → Client uses props for query
 */
export function ProductGroupPaginationList({
	expanded: expandedProp,
	cursors,
	limit,
	filter = null,
	search: searchQuery = null,
	sort = [],
}: Props) {
	const trpc = useTRPC();

	// 1. Group counts (Suspense OK - matches server prefetch)
	const { data: groupCounts } = useSuspenseQuery(
		trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" })
	);

	// 2. Apply default on client
	const expanded = expandedProp ?? DEFAULT_EXPANDED;

	// 3. Get all group keys (stable order)
	const allGroupKeys = Object.keys(groupCounts);

	// 4. Single hook call - creates queries internally using TRPC queryOptions
	// search is now a Filter (converted from URL param by server)
	const { data, pagination, handleAccordionChange } = useGroupPagePagination({
		allGroupKeys,
		expanded,
		cursors,
		groupCounts,
		limit,
		createQueryOptions: (groupKey, cursor) =>
			trpc.product.getMany.queryOptions({
				filter: combineFilters(groupKey, filter),
				search: searchQuery,
				sort,
				cursor,
				limit,
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
		<Suspense fallback={<ListSkeleton rowCount={8} />}>
			<DataViewProvider
				data={data}
				pagination={pagination}
				properties={productProperties}
			>
				<div className="flex items-center justify-between">
					<GroupPaginationTabs />
					<DataViewOptions />
				</div>

				<ListView
					pagination="page"
					view={{
						group: {
							groupBy: "familyGroup",
							showAggregation: true,
							expandedGroups: expanded,
							onExpandedChange: handleAccordionChange,
						},
					}}
				/>
			</DataViewProvider>
		</Suspense>
	);
}
