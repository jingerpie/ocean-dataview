"use client";

import {
	ListSkeleton,
	ListView,
} from "@ocean-dataview/dataview/components/views/list-view";
import { DataViewOptions } from "@ocean-dataview/dataview/components/views/shared/data-view-options";
import { DataViewProvider } from "@ocean-dataview/dataview/components/views/shared/data-view-provider";
import { useInfinitePagination } from "@ocean-dataview/dataview/lib/data-views/hooks";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { PaginationTabs } from "./pagination-tabs";
import { productProperties } from "./product-properties";

interface ProductPaginationListProps {
	limit: number;
}

/**
 * Product List with infinite pagination (infinite scroll).
 *
 * Pattern: Uses useSuspenseInfiniteQuery for data accumulation
 * - Data is appended automatically when scrolling near bottom
 * - URL state is shallow (no server re-render for infinite scroll)
 * - useInfinitePagination handles data flattening + pagination state
 */
export const ProductPaginationList = (props: ProductPaginationListProps) => (
	<Suspense fallback={<ListSkeleton rowCount={8} />}>
		<ProductPaginationListView {...props} />
	</Suspense>
);

const ProductPaginationListView = ({
	limit: defaultLimit,
}: ProductPaginationListProps) => {
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
			<div className="flex min-h-[400px] items-center justify-center">
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

			<ListView pagination="loadMore" />
		</DataViewProvider>
	);
};
