"use client";

import { NotionToolbar } from "@ocean-dataview/dataview/components/ui";
import {
	TableSkeleton,
	TableView,
} from "@ocean-dataview/dataview/components/views/table-view";
import {
	useFilterParams,
	usePagePagination,
	useSearchParams,
	useSortParams,
} from "@ocean-dataview/dataview/hooks";
import { DataViewProvider } from "@ocean-dataview/dataview/lib/providers";
import type {
	CursorValue,
	PropertySort,
	WhereNode,
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
	cursor?: CursorValue | null;
	limit: number;
	filter?: WhereNode | null;
	/** Search filter (converted from URL ?search=xxx by server page) */
	search?: WhereNode | null;
	sorts?: PropertySort<Product>[];
}

/**
 * Product Table with simple cursor-based pagination.
 *
 * Pattern: Server prefetch → Props → Client uses props for query
 * - Server parses URL, prefetches, passes props
 * - Client uses useSuspenseQuery with props (matches server prefetch = cache hit)
 * - usePagePagination handles URL updates (shallow: false)
 *
 * NOTE: No Suspense wrapper - matches turboitem pattern where void prefetch works
 */
export function ProductPaginationTable(props: PaginationProps) {
	const {
		cursor,
		limit,
		filter = null,
		search: searchQuery = null,
		sorts = [],
	} = props;
	const trpc = useTRPC();

	// Hooks for UI state management (used by toolbar for user interactions)
	// Note: useSearchParams uses URL state for the search input display
	const { setFilter } = useFilterParams();
	const { search, setSearch } = useSearchParams();
	const { setSort: setSorts } = useSortParams<Product>({ sort: sorts });

	// Query with props directly - MUST match server prefetch for cache hit
	// search is now a Filter (converted from URL param by server)
	const { data } = useSuspenseQuery(
		trpc.product.getMany.queryOptions({
			cursor,
			limit,
			filter,
			search: searchQuery, // Pass Filter for cache hit
			sort: sorts,
		})
	);

	// Pagination controls using the new hook
	const pagination = usePagePagination({
		cursor,
		limit,
		data,
		limitOptions: [10, 25, 50, 100],
	});

	// Empty state
	// if (data.items.length === 0) {
	// 	return (
	// 		<div className="flex min-h-100 items-center justify-center">
	// 			<p className="text-muted-foreground">No products found</p>
	// 		</div>
	// 	);
	// }

	return (
		<Suspense fallback={<TableSkeleton columnCount={5} rowCount={10} />}>
			<DataViewProvider
				data={data.items}
				pagination={pagination}
				properties={productProperties}
			>
				<NotionToolbar
					enableFilter
					enableProperties
					enableSearch
					enableSort
					filter={filter}
					onFilterChange={setFilter}
					onSearchChange={setSearch}
					onSortsChange={setSorts}
					properties={productProperties}
					search={search}
					sorts={sorts}
				>
					<PaginationTabs />
				</NotionToolbar>
				<TableView
					layout={{ showVerticalLines: false, wrapAllColumns: false }}
					pagination="page"
				/>
			</DataViewProvider>
		</Suspense>
	);
}
