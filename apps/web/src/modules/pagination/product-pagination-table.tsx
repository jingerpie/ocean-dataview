"use client";

import { PagePagination } from "@ocean-dataview/ui/components/data-views/shared/page-pagination";
import {
	DataViewOptions,
	TableProvider,
	TableView,
} from "@ocean-dataview/ui/components/data-views/table-view";
import { usePagination } from "@ocean-dataview/ui/lib/data-views/hooks";
import { useTRPC } from "@/utils/trpc/client";
import { PaginationTabs } from "./pagination-tabs";
import { type Product, productProperties } from "./product-properties";

/**
 * Product Table with simple cursor-based pagination.
 *
 * Uses the usePagination hook for flat (non-grouped) pagination:
 * - Single query with cursor-based navigation
 * - URL state for after/before/limit/start
 * - "Showing X-Y" display
 */
export const ProductPaginationTable = () => {
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
		<TableProvider data={data} properties={productProperties}>
			<div className="flex items-center justify-between">
				<PaginationTabs />
				<DataViewOptions />
			</div>

			<TableView layout={{ showVerticalLines: false, wrapAllColumns: false }} />

			<PagePagination {...pagination} />
		</TableProvider>
	);
};
