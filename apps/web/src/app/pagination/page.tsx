import { filterSortParams, paginationParams } from "@ocean-dataview/shared/lib";
import {
	ALL_GROUP,
	getCursor,
	getCursorParams,
} from "@ocean-dataview/shared/types";
import { getValidFilters } from "@ocean-dataview/shared/utils";
import { Tabs, TabsContent } from "@ocean-dataview/ui/components/tabs";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductGroupPaginationBoard } from "@/modules/pagination/product-group-pagination-board";
import { ProductPaginationGallery } from "@/modules/pagination/product-pagination-gallery";
import { ProductPaginationList } from "@/modules/pagination/product-pagination-list";
import { ProductPaginationTable } from "@/modules/pagination/product-pagination-table";
import { getQueryClient, trpc } from "@/utils/trpc/server";

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PaginationPage({ searchParams }: PageProps) {
	// 1. Parse URL params server-side
	const params = await paginationParams.parse(searchParams);
	const { cursors, limit } = params;

	// Parse filter/sort params (global, not per-group)
	const filterSort = await filterSortParams.parse(searchParams);
	const { filters, sort } = filterSort;

	// Filter out empty values before API calls
	const validFilters = getValidFilters(filters);

	// Extract cursor params for prefetch
	const cursor = getCursor(cursors, ALL_GROUP);
	const { after, before } = getCursorParams(cursor);

	// 2. Get query client
	const queryClient = getQueryClient();

	// Default sort if none specified
	const effectiveSort =
		sort.length > 0 ? sort : [{ propertyId: "updatedAt" as const, desc: true }];

	// 3. Prefetch data for table (page-based pagination)
	void queryClient.prefetchQuery(
		trpc.product.getMany.queryOptions({
			after,
			before,
			limit,
			filters: validFilters,
			sort: effectiveSort,
		}),
	);

	// 4. Hydrate client with prefetched data
	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<Tabs defaultValue="table" className="w-full">
				<TabsContent value="table">
					<ProductPaginationTable
						cursors={cursors}
						limit={limit}
						filters={validFilters}
						sort={effectiveSort}
					/>
				</TabsContent>
				<TabsContent value="list">
					<ProductPaginationList
						limit={limit}
						filters={validFilters}
						sort={effectiveSort}
					/>
				</TabsContent>
				<TabsContent value="gallery">
					<ProductPaginationGallery
						limit={limit}
						filters={validFilters}
						sort={effectiveSort}
					/>
				</TabsContent>
				<TabsContent value="board">
					<ProductGroupPaginationBoard
						limit={limit}
						filters={validFilters}
						sort={effectiveSort}
					/>
				</TabsContent>
			</Tabs>
		</HydrationBoundary>
	);
}
