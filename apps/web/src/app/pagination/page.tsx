import { dataViewParams } from "@ocean-dataview/shared/lib";
import { ALL_GROUP, getCursor } from "@ocean-dataview/shared/types";
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

export default async function PaginationPage(props: PageProps) {
	const searchParams = await props.searchParams;
	const params = dataViewParams.parse(searchParams);

	const { cursors, limit, filters, sort, joinOperator } = params;

	const validFilters = getValidFilters(filters);
	const cursor = getCursor(cursors, ALL_GROUP);
	const queryClient = getQueryClient();

	void queryClient.prefetchQuery(
		trpc.product.getMany.queryOptions({
			cursor,
			limit,
			filters: validFilters,
			sort,
			joinOperator,
		}),
	);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<Tabs defaultValue="table" className="w-full">
				<TabsContent value="table">
					<ProductPaginationTable
						cursors={cursors}
						limit={limit}
						filters={validFilters}
						sort={sort}
						joinOperator={joinOperator}
					/>
				</TabsContent>
				<TabsContent value="list">
					<ProductPaginationList
						limit={limit}
						filters={validFilters}
						sort={sort}
					/>
				</TabsContent>
				<TabsContent value="gallery">
					<ProductPaginationGallery
						limit={limit}
						filters={validFilters}
						sort={sort}
					/>
				</TabsContent>
				<TabsContent value="board">
					<ProductGroupPaginationBoard
						limit={limit}
						filters={validFilters}
						sort={sort}
					/>
				</TabsContent>
			</Tabs>
		</HydrationBoundary>
	);
}
