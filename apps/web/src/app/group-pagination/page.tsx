import { productSearchParamsType } from "@ocean-dataview/shared/types";
import { Tabs, TabsContent } from "@ocean-dataview/ui/components/tabs";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductGroupPaginationGallery } from "@/modules/group-pagination/product-group-pagination-gallery";
import { ProductGroupPaginationList } from "@/modules/group-pagination/product-group-pagination-list";
import { ProductGroupPaginationTable } from "@/modules/group-pagination/product-group-pagination-table";
import { ProductSubGroupPaginationBoard } from "@/modules/group-pagination/product-sub-group-pagination-board";
import { getQueryClient, trpc } from "@/utils/trpc/server";

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GroupPaginationPage({ searchParams }: PageProps) {
	// 1. Parse URL params server-side
	const params = await productSearchParamsType.parse(searchParams);

	// 2. Get query client
	const queryClient = getQueryClient();

	// 3. Prefetch group counts (non-blocking with void)
	void queryClient.prefetchQuery(
		trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" }),
	);

	// 4. Prefetch first expanded group's data (if URL has expanded groups)
	const firstExpanded = params.expanded?.[0];
	if (firstExpanded) {
		void queryClient.prefetchQuery(
			trpc.product.getMany.queryOptions({
				filters: [
					{
						propertyId: "familyGroup",
						operator: "eq",
						value: firstExpanded,
						variant: "select",
						filterId: "familyGroup-group",
					},
				],
				sort: [{ propertyId: "updatedAt", desc: false }],
				limit: params.limit,
			}),
		);
	}

	// 5. Hydrate client with prefetched data
	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<Tabs defaultValue="table" className="w-full">
				<TabsContent value="table">
					<ProductGroupPaginationTable />
				</TabsContent>
				<TabsContent value="list">
					<ProductGroupPaginationList />
				</TabsContent>
				<TabsContent value="gallery">
					<ProductGroupPaginationGallery />
				</TabsContent>
				<TabsContent value="board">
					<ProductSubGroupPaginationBoard />
				</TabsContent>
			</Tabs>
		</HydrationBoundary>
	);
}
