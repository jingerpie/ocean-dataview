"use client";

import { DataViewOptions } from "@ocean-dataview/dataview/components/ui/tool-bar";
import {
	TableSkeleton,
	TableView,
} from "@ocean-dataview/dataview/components/views/table-view";
import { useGroupPagePagination } from "@ocean-dataview/dataview/hooks";
import { DataViewProvider } from "@ocean-dataview/dataview/lib/providers";
import type {
	Cursors,
	PropertyFilter,
	PropertySort,
} from "@ocean-dataview/shared/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { GroupPaginationTabs } from "./group-pagination-tabs";
import { type Product, productProperties } from "./product-properties";

const DEFAULT_EXPANDED: string[] = [];

/**
 * Props passed from server (parsed URL params)
 */
interface Props {
	expanded: string[] | null;
	cursors: Cursors;
	limit: number;
	filters?: PropertyFilter<Product>[];
	sort?: PropertySort<Product>[];
	joinOperator?: "and" | "or";
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
export function ProductGroupPaginationTable({
	expanded: expandedProp,
	cursors,
	limit,
	filters = [],
	sort = [],
	joinOperator = "and",
}: Props) {
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
		<Suspense fallback={<TableSkeleton columnCount={5} rowCount={10} />}>
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
		</Suspense>
	);
}
