"use client";

import { DataViewOptions } from "@ocean-dataview/dataview/components/views/shared/data-view-options";
import { DataViewProvider } from "@ocean-dataview/dataview/components/views/shared/data-view-provider";
import {
	TableSkeleton,
	TableView,
} from "@ocean-dataview/dataview/components/views/table-view";
import { usePagePagination } from "@ocean-dataview/dataview/lib/data-views";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { PaginationTabs } from "./pagination-tabs";
import { productProperties } from "./product-properties";

/**
 * Props passed from server (parsed URL params)
 */
interface PaginationProps {
	after: string | null;
	before: string | null;
	limit: number;
	start: number;
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
	const { after, before, limit, start } = props;
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

	// Pagination controls using the new hook
	const pagination = usePagePagination({
		after,
		before,
		limit,
		start,
		data,
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

			<TableView
				layout={{ showVerticalLines: false, wrapAllColumns: false }}
				pagination="page"
			/>
		</DataViewProvider>
	);
};
