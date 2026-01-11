import { groupPaginationParams } from "@ocean-dataview/shared/lib";
import { getValidFilters } from "@ocean-dataview/shared/utils";
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

	const { expanded, cursors, limit, filters, sort, joinOperator } = params;
	const validFilters = getValidFilters(filters);
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
						filters={validFilters}
						sort={sort}
						joinOperator={joinOperator}
					/>
				</TabsContent>
				<TabsContent value="list">
					<ProductGroupPaginationList
						expanded={expanded}
						cursors={cursors}
						limit={limit}
						filters={validFilters}
						sort={sort}
						joinOperator={joinOperator}
					/>
				</TabsContent>
				<TabsContent value="gallery">
					<ProductGroupPaginationGallery
						expanded={expanded}
						cursors={cursors}
						limit={limit}
						filters={validFilters}
						sort={sort}
						joinOperator={joinOperator}
					/>
				</TabsContent>
				<TabsContent value="board">
					<ProductSubGroupPaginationBoard
						cursors={cursors}
						limit={limit}
						filters={validFilters}
						sort={sort}
						joinOperator={joinOperator}
					/>
				</TabsContent>
			</Tabs>
		</HydrationBoundary>
	);
}
