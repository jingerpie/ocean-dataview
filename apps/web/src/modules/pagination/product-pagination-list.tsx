"use client";

import { DataViewOptions } from "@ocean-dataview/dataview/components/ui/tool-bar";
import {
	ListSkeleton,
	ListView,
} from "@ocean-dataview/dataview/components/views/list-view";
import { useInfinitePagination } from "@ocean-dataview/dataview/hooks";
import { DataViewProvider } from "@ocean-dataview/dataview/lib/providers";
import type {
	PropertyFilter,
	PropertySort,
} from "@ocean-dataview/shared/types";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { PaginationTabs } from "./pagination-tabs";
import { type Product, productProperties } from "./product-properties";

interface ProductPaginationListProps {
	limit: number;
	filters?: PropertyFilter<Product>[];
	sort?: PropertySort<Product>[];
	joinOperator?: "and" | "or";
}

/**
 * Product List with infinite pagination (infinite scroll).
 *
 * Pattern: Uses useSuspenseInfiniteQuery for data accumulation
 * - Data is appended automatically when scrolling near bottom
 * - URL state is shallow (no server re-render for infinite scroll)
 * - useInfinitePagination handles data flattening + pagination state
 */
export function ProductPaginationList({
	limit: defaultLimit,
	filters = [],
	sort = [],
	joinOperator = "and",
}: ProductPaginationListProps) {
	const trpc = useTRPC();

	// Infinite query using TRPC infiniteQueryOptions
	const infiniteQuery = useSuspenseInfiniteQuery(
		trpc.product.getMany.infiniteQueryOptions(
			{
				limit: defaultLimit,
				filters,
				sort,
				joinOperator,
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
		<Suspense fallback={<ListSkeleton rowCount={8} />}>
			<DataViewProvider
				data={items}
				properties={productProperties}
				pagination={pagination}
			>
				<div className="flex items-center justify-between">
					<PaginationTabs />
					<DataViewOptions />
				</div>

				<ListView pagination="loadMore" />
			</DataViewProvider>
		</Suspense>
	);
}
