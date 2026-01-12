"use client";

import { NotionToolbar } from "@ocean-dataview/dataview/components/ui";
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
import type {
	CursorValue,
	Filter,
	PropertySort,
} from "@ocean-dataview/shared/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { PaginationTabs } from "./pagination-tabs";
import { type Product, productProperties } from "./product-properties";

/**
 * Props passed from server (parsed URL params)
 */
interface PaginationProps {
	cursor?: CursorValue | null;
	limit: number;
	filter?: Filter | null;
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
	const { cursor, limit, filter = null, sorts = [] } = props;
	const trpc = useTRPC();

	// Local search state (client-side filtering)
	const [search, setSearch] = useState("");

	// Hooks for UI state management (used by toolbar for user interactions)
	const { setFilter } = useFilterParams();
	const { setSort: setSorts } = useSortParams<Product>({ sort: sorts });

	// Query with props directly - MUST match server prefetch for cache hit
	const { data } = useSuspenseQuery(
		trpc.product.getMany.queryOptions({
			cursor,
			limit,
			filter,
			sort: sorts,
		}),
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
				properties={productProperties}
				pagination={pagination}
			>
				<NotionToolbar
					properties={productProperties}
					filter={filter}
					onFilterChange={setFilter}
					sorts={sorts}
					onSortsChange={setSorts}
					search={search}
					onSearchChange={setSearch}
					enableSearch
					enableFilter
					enableSort
					enableProperties
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
