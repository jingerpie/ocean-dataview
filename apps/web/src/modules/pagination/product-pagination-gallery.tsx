"use client";

import {
	GallerySkeleton,
	GalleryView,
} from "@ocean-dataview/dataview/components/data-views/gallery-view";
import { DataViewOptions } from "@ocean-dataview/dataview/components/data-views/shared/data-view-options";
import { DataViewProvider } from "@ocean-dataview/dataview/components/data-views/shared/data-view-provider";
import {
	type PaginationProps,
	usePaginationControls,
} from "@ocean-dataview/dataview/lib/data-views/hooks";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { PaginationTabs } from "./pagination-tabs";
import { type Product, productProperties } from "./product-properties";

/**
 * Product Gallery with simple cursor-based pagination.
 *
 * Pattern: Server prefetch → Props → Client uses props for query
 */
export const ProductPaginationGallery = (props: PaginationProps) => (
	<Suspense fallback={<GallerySkeleton cardCount={6} />}>
		<ProductPaginationGalleryView {...props} />
	</Suspense>
);

const ProductPaginationGalleryView = (props: PaginationProps) => {
	const { after, before, limit } = props;
	const trpc = useTRPC();

	// Query with props (matches server prefetch)
	const { data } = useSuspenseQuery(
		trpc.product.getMany.queryOptions({
			after: after ?? undefined,
			before: before ?? undefined,
			limit,
			sort: [{ propertyId: "updatedAt", desc: true }],
		}),
	);

	// Pagination controls (URL setters only)
	const pagination = usePaginationControls<Product>({
		props,
		queryData: data,
		limitOptions: [10, 25, 50, 100],
	});

	// Empty state
	if (data.items.length === 0) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<p className="text-muted-foreground">No products found</p>
			</div>
		);
	}

	return (
		<DataViewProvider
			data={data.items}
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
				pagination="page"
			/>
		</DataViewProvider>
	);
};
