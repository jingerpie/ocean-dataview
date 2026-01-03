"use client";

import { GalleryView } from "@ocean-dataview/dataview/components/data-views/gallery-view";
import { DataViewOptions } from "@ocean-dataview/dataview/components/data-views/shared/data-view-options";
import { DataViewProvider } from "@ocean-dataview/dataview/components/data-views/shared/data-view-provider";
import { PagePagination } from "@ocean-dataview/dataview/components/data-views/shared/page-pagination";
import { usePagination } from "@ocean-dataview/dataview/lib/data-views/hooks";
import { useTRPC } from "@/utils/trpc/client";
import { PaginationTabs } from "./pagination-tabs";
import { type Product, productProperties } from "./product-properties";

/**
 * Product Gallery with simple cursor-based pagination.
 */
export const ProductPaginationGallery = () => {
	const trpc = useTRPC();

	const { data, pagination, isLoading } = usePagination<Product>({
		createQueryOptions: (after, before, limit) =>
			trpc.product.getMany.queryOptions({
				after,
				before,
				limit,
				sort: [{ propertyId: "updatedAt", desc: true }],
			}),
		defaultLimit: 25,
		limitOptions: [10, 25, 50, 100],
	});

	// Loading state
	if (isLoading && data.length === 0) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<div className="text-center">
					<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
					<p className="text-muted-foreground">Loading products...</p>
				</div>
			</div>
		);
	}

	// Empty state
	if (!isLoading && data.length === 0) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<p className="text-muted-foreground">No products found</p>
			</div>
		);
	}

	return (
		<DataViewProvider data={data} properties={productProperties}>
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
			/>

			<PagePagination {...pagination} />
		</DataViewProvider>
	);
};
