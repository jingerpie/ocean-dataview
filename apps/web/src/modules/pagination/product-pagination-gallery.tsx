"use client";

import { NotionToolbar } from "@ocean-dataview/dataview/components/ui";
import {
	GallerySkeleton,
	GalleryView,
} from "@ocean-dataview/dataview/components/views/gallery-view";
import {
	useFilterParams,
	useInfinitePagination,
	useSearchParams,
	useSortParams,
} from "@ocean-dataview/dataview/hooks";

import { DataViewProvider } from "@ocean-dataview/dataview/lib/providers";
import type { PropertySort, WhereNode } from "@ocean-dataview/shared/types";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { PaginationTabs } from "./pagination-tabs";
import { type Product, productProperties } from "./product-properties";

interface ProductPaginationGalleryProps {
	limit: number;
	filter?: WhereNode | null;
	/** Search filter (converted from URL ?search=xxx by server page) */
	search?: WhereNode | null;
	sort?: PropertySort<Product>[];
}

/**
 * Product Gallery with infinite pagination (load more).
 *
 * Pattern: Uses useSuspenseInfiniteQuery for data accumulation
 * - Data is appended when "Load More" is clicked
 * - URL state is shallow (no server re-render for infinite scroll)
 * - useInfinitePagination handles data flattening + pagination state
 */
export function ProductPaginationGallery({
	limit: defaultLimit,
	filter = null,
	search: searchQuery = null,
	sort = [],
}: ProductPaginationGalleryProps) {
	const trpc = useTRPC();

	// Infinite query using TRPC infiniteQueryOptions
	// search is now a Filter (converted from URL param by server)
	const infiniteQuery = useSuspenseInfiniteQuery(
		trpc.product.getMany.infiniteQueryOptions(
			{
				limit: defaultLimit,
				filter,
				search: searchQuery,
				sort,
			},
			{
				getNextPageParam: (lastPage) => lastPage.endCursor ?? undefined,
			}
		)
	);

	// Use the new hook for pagination state
	const { items, pagination } = useInfinitePagination({
		infiniteQuery,
		defaultLimit,
		limitOptions: [10, 25, 50, 100],
	});

	// Hooks for UI state management
	// Note: useSearchParams uses URL state for the search input display
	const { setFilter } = useFilterParams();
	const { search, setSearch } = useSearchParams();
	const { setSort: setSorts } = useSortParams<Product>({ sort });

	return (
		<Suspense fallback={<GallerySkeleton cardCount={6} />}>
			<DataViewProvider
				data={items}
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
					sorts={sort}
				>
					<PaginationTabs />
				</NotionToolbar>

				{items.length === 0 ? (
					<div className="flex min-h-100 items-center justify-center">
						<p className="text-muted-foreground">No products found</p>
					</div>
				) : (
					<GalleryView
						layout={{
							cardPreview: "image",
							cardSize: "medium",
							fitImage: true,
						}}
						pagination="loadMore"
					/>
				)}
			</DataViewProvider>
		</Suspense>
	);
}
