import { groupPaginationParams } from "@ocean-dataview/shared/lib";
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

export default async function GroupPaginationPage(props: PageProps) {
	const searchParams = await props.searchParams;
	const params = groupPaginationParams.parse(searchParams);

	const { expanded, cursors, limit, filter, sort } = params;
	const queryClient = getQueryClient();

	void queryClient.prefetchQuery(
		trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" }),
	);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<Tabs defaultValue="table" className="w-full">
				<TabsContent value="table">
					<ProductGroupPaginationTable
						expanded={expanded}
						cursors={cursors}
						limit={limit}
						filter={filter}
						sort={sort}
					/>
				</TabsContent>
				<TabsContent value="list">
					<ProductGroupPaginationList
						expanded={expanded}
						cursors={cursors}
						limit={limit}
						filter={filter}
						sort={sort}
					/>
				</TabsContent>
				<TabsContent value="gallery">
					<ProductGroupPaginationGallery
						expanded={expanded}
						cursors={cursors}
						limit={limit}
						filter={filter}
						sort={sort}
					/>
				</TabsContent>
				<TabsContent value="board">
					<ProductSubGroupPaginationBoard
						cursors={cursors}
						limit={limit}
						filter={filter}
						sort={sort}
					/>
				</TabsContent>
			</Tabs>
		</HydrationBoundary>
	);
}
