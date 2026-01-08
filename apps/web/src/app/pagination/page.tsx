import { flatPaginationParams } from "@ocean-dataview/shared/lib";
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
	const params = await flatPaginationParams.parse(searchParams);
	const { after, before, limit, start } = params;

	// 2. Get query client
	const queryClient = getQueryClient();

	// 3. Prefetch data for table (page-based pagination)
	void queryClient.prefetchQuery(
		trpc.product.getMany.queryOptions({
			after: after ?? undefined,
			before: before ?? undefined,
			limit,
			sort: [{ propertyId: "updatedAt", desc: true }],
		}),
	);

	// 4. Hydrate client with prefetched data
	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<Tabs defaultValue="table" className="w-full">
				<TabsContent value="table">
					<ProductPaginationTable
						after={after}
						before={before}
						limit={limit}
						start={start}
					/>
				</TabsContent>
				<TabsContent value="list">
					<ProductPaginationList limit={limit} />
				</TabsContent>
				<TabsContent value="gallery">
					<ProductPaginationGallery limit={limit} />
				</TabsContent>
				<TabsContent value="board">
					<ProductGroupPaginationBoard limit={limit} />
				</TabsContent>
			</Tabs>
		</HydrationBoundary>
	);
}
