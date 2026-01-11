"use client";

import { DataViewOptions } from "@ocean-dataview/dataview/components/ui/tool-bar";
import {
	GallerySkeleton,
	GalleryView,
} from "@ocean-dataview/dataview/components/views/gallery-view";
import { useGroupInfinitePagination } from "@ocean-dataview/dataview/hooks";
import { DataViewProvider } from "@ocean-dataview/dataview/lib/providers";
import type {
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
	cursors: unknown; // Not used for infinite pagination, but passed from page
	limit: number;
	filters?: PropertyFilter<Product>[];
	sort?: PropertySort<Product>[];
	joinOperator?: "and" | "or";
}

/**
 * Product Group Gallery with infinite load-more pagination per group.
 *
 * Pattern: Uses useGroupInfinitePagination for per-group data accumulation
 * - Each group has its own "Load More" button
 * - Data accumulates client-side per group
 */
export function ProductGroupPaginationGallery({
	expanded: expandedProp,
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

	// 3. Get all group keys
	const allGroupKeys = Object.keys(groupCounts);

	// 4. Single hook call - creates queries internally using TRPC infiniteQueryOptions
	const { data, pagination, handleAccordionChange } =
		useGroupInfinitePagination({
			allGroupKeys,
			expanded,
			groupCounts,
			limit,
			createQueryOptions: (groupKey) =>
				trpc.product.getMany.infiniteQueryOptions(
					{
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
						limit,
						joinOperator,
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
		<Suspense fallback={<GallerySkeleton cardCount={6} />}>
			<DataViewProvider
				data={data}
				properties={productProperties}
				pagination={pagination}
			>
				<div className="flex items-center justify-between">
					<GroupPaginationTabs />
					<DataViewOptions />
				</div>

				<GalleryView
					layout={{
						cardPreview: "image",
						cardSize: "medium",
						fitImage: true,
					}}
					view={{
						group: {
							groupBy: "familyGroup",
							showAggregation: true,
							expandedGroups: expanded,
							onExpandedChange: handleAccordionChange,
						},
					}}
					pagination="loadMore"
				/>
			</DataViewProvider>
		</Suspense>
	);
}
