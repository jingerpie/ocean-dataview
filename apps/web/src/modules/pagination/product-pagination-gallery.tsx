"use client";

import { DataViewOptions } from "@ocean-dataview/dataview/components/ui/tool-bar";
import {
	GallerySkeleton,
	GalleryView,
} from "@ocean-dataview/dataview/components/views/gallery-view";
import { useInfinitePagination } from "@ocean-dataview/dataview/hooks";
import { DataViewProvider } from "@ocean-dataview/dataview/lib/providers";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { PaginationTabs } from "./pagination-tabs";
import { productProperties } from "./product-properties";

interface ProductPaginationGalleryProps {
	limit: number;
}

/**
 * Product Gallery with infinite pagination (load more).
 *
 * Pattern: Uses useSuspenseInfiniteQuery for data accumulation
 * - Data is appended when "Load More" is clicked
 * - URL state is shallow (no server re-render for infinite scroll)
 * - useInfinitePagination handles data flattening + pagination state
 */
export const ProductPaginationGallery = (
	props: ProductPaginationGalleryProps,
) => (
	<Suspense fallback={<GallerySkeleton cardCount={6} />}>
		<ProductPaginationGalleryView {...props} />
	</Suspense>
);

const ProductPaginationGalleryView = ({
	limit: defaultLimit,
}: ProductPaginationGalleryProps) => {
	const trpc = useTRPC();

	// Infinite query using TRPC infiniteQueryOptions
	const infiniteQuery = useSuspenseInfiniteQuery(
		trpc.product.getMany.infiniteQueryOptions(
			{
				limit: defaultLimit,
				sort: [{ propertyId: "updatedAt", desc: true }],
			},
			{
				getNextPageParam: (lastPage) => lastPage.endCursor ?? undefined,
			},
		),
	);

	// Use the new hook for pagination state
	const { items, pagination } = useInfinitePagination({
		infiniteQuery,
		defaultLimit,
		limitOptions: [10, 25, 50, 100],
	});

	// Empty state
	if (items.length === 0) {
		return (
			<div className="flex min-h-100 items-center justify-center">
				<p className="text-muted-foreground">No products found</p>
			</div>
		);
	}

	return (
		<DataViewProvider
			data={items}
			properties={productProperties}
			pagination={pagination}
		>
			<div className="flex items-center justify-between">
				<PaginationTabs />
				<DataViewOptions />
			</div>

			<GalleryView
				layout={{
					cardPreview: "image",
					cardSize: "medium",
					fitImage: true,
				}}
				pagination="loadMore"
			/>
		</DataViewProvider>
	);
};
