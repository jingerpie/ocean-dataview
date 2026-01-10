"use client";

import { ShopifyToolbar } from "@ocean-dataview/dataview/components/ui/tool-bar";
import {
	TableSkeleton,
	TableView,
} from "@ocean-dataview/dataview/components/views/table-view";
import {
	useFilterParams,
	usePagePagination,
	useSortParams,
} from "@ocean-dataview/dataview/hooks";
import { DataViewProvider } from "@ocean-dataview/dataview/lib/providers";
import {
	ALL_GROUP,
	type CursorState,
	getCursor,
	getCursorParams,
	type PropertyFilter,
	type PropertySort,
} from "@ocean-dataview/shared/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { PaginationTabs } from "./pagination-tabs";
import { type Product, productProperties } from "./product-properties";

/**
 * Props passed from server (parsed URL params)
 */
interface PaginationProps {
	cursors: CursorState[];
	limit: number;
	filters?: PropertyFilter<Product>[];
	sort?: PropertySort<Product>[];
}

/**
 * Product Table with simple cursor-based pagination.
 *
 * Pattern: Server prefetch → Props → Client uses props for query
 * - Server parses URL, prefetches, passes props
 * - Client uses useSuspenseQuery with props (matches server prefetch = cache hit)
 * - usePagePagination handles URL updates (shallow: false)
 */
export const ProductPaginationTable = (props: PaginationProps) => (
	<Suspense fallback={<TableSkeleton columnCount={5} rowCount={10} />}>
		<ProductPaginationTableView {...props} />
	</Suspense>
);

const ProductPaginationTableView = (props: PaginationProps) => {
	const {
		cursors,
		limit,
		filters: initialFilters = [],
		sort: initialSort = [],
	} = props;
	const trpc = useTRPC();

	// Filter and sort state from URL
	const { filters, setFilters } = useFilterParams<Product>({
		filters: initialFilters,
	});
	const { sort, setSort } = useSortParams<Product>({ sort: initialSort });

	// Extract cursor params for flat pagination
	const cursor = getCursor(cursors, ALL_GROUP);
	const { after, before } = getCursorParams(cursor);

	// Query with current filters/sort from URL
	const { data } = useSuspenseQuery(
		trpc.product.getMany.queryOptions({
			after,
			before,
			limit,
			filters,
			sort,
		}),
	);

	// Pagination controls using the new hook
	const pagination = usePagePagination({
		cursors,
		limit,
		data,
		limitOptions: [10, 25, 50, 100],
	});

	// Empty state
	if (data.items.length === 0) {
		return (
			<div className="flex min-h-100 items-center justify-center">
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
			<ShopifyToolbar
				properties={productProperties}
				filters={filters}
				onFiltersChange={setFilters}
				sorts={sort}
				onSortsChange={setSort}
				searchProperties={["name"]}
				enableSearch
				enableFilters
				enableSort
				enableViewOptions
			>
				<PaginationTabs />
			</ShopifyToolbar>

			<TableView
				layout={{ showVerticalLines: false, wrapAllColumns: false }}
				pagination="page"
			/>
		</DataViewProvider>
	);
};
