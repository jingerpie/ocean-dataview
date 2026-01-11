import { paginationParams } from "@ocean-dataview/shared/lib";
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

export default async function PaginationPage(props: PageProps) {
	const searchParams = await props.searchParams;
	const params = paginationParams.parse(searchParams);

	const { cursor, limit, filter, sort } = params;

	const queryClient = getQueryClient();

	void queryClient.prefetchQuery(
		trpc.product.getMany.queryOptions({
			cursor,
			limit,
			filter,
			sort,
		}),
	);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<Tabs defaultValue="table" className="w-full">
				<TabsContent value="table">
					<ProductPaginationTable
						cursor={cursor}
						limit={limit}
						filter={filter}
						sort={sort}
					/>
				</TabsContent>
				<TabsContent value="list">
					<ProductPaginationList limit={limit} filter={filter} sort={sort} />
				</TabsContent>
				<TabsContent value="gallery">
					<ProductPaginationGallery limit={limit} filter={filter} sort={sort} />
				</TabsContent>
				<TabsContent value="board">
					<ProductGroupPaginationBoard
						limit={limit}
						filter={filter}
						sort={sort}
					/>
				</TabsContent>
			</Tabs>
		</HydrationBoundary>
	);
}
