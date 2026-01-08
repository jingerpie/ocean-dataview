"use client";

import {
	GallerySkeleton,
	GalleryView,
} from "@ocean-dataview/dataview/components/data-views/gallery-view";
import { DataViewOptions } from "@ocean-dataview/dataview/components/data-views/shared/data-view-options";
import { DataViewProvider } from "@ocean-dataview/dataview/components/data-views/shared/data-view-provider";
import { useGroupData } from "@ocean-dataview/dataview/lib/data-views/hooks";
import {
	type CursorState,
	getCursor,
	getCursorParams,
} from "@ocean-dataview/shared/types";
import { useQueries, useSuspenseQuery } from "@tanstack/react-query";
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
	cursors: CursorState[];
	limit: number;
}

/**
 * Product Group Gallery with cursor-based pagination.
 *
 * Pattern: Server prefetch → Props → Client uses props for query
 */
export const ProductGroupPaginationGallery = (props: Props) => (
	<Suspense fallback={<GallerySkeleton cardCount={6} />}>
		<ProductGroupPaginationGalleryView {...props} />
	</Suspense>
);

const ProductGroupPaginationGalleryView = ({
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

	// 4. useQueries with enabled flag - uses cursors from props
	const groupQueries = useQueries({
		queries: allGroupKeys.map((groupKey) => {
			const cursor = getCursor(cursors, groupKey);
			const { after, before } = getCursorParams(cursor);

			return {
				...trpc.product.getMany.queryOptions({
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
				enabled: expanded.includes(groupKey),
			};
		}),
	});

	// 5. useGroupData hook
	const { data, pagination, handleAccordionChange } = useGroupData<Product>({
		groupQueries,
		allGroupKeys,
		expanded,
		cursors,
		groupCounts,
		limit,
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
				pagination="page"
			/>
		</DataViewProvider>
	);
};
