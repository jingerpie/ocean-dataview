import { getSearchableProperties } from "@ocean-dataview/dataview/types";
import { groupPaginationParams } from "@ocean-dataview/shared/lib";
import { buildSearchFilter } from "@ocean-dataview/shared/utils";
import { Tabs, TabsContent } from "@ocean-dataview/ui/components/tabs";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductGroupPaginationGallery } from "@/modules/group-pagination/product-group-pagination-gallery";
import { ProductGroupPaginationList } from "@/modules/group-pagination/product-group-pagination-list";
import { ProductGroupPaginationTable } from "@/modules/group-pagination/product-group-pagination-table";
import { productProperties } from "@/modules/group-pagination/product-properties";
import { ProductSubGroupPaginationBoard } from "@/modules/group-pagination/product-sub-group-pagination-board";
import { getQueryClient, trpc } from "@/utils/trpc/server";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GroupPaginationPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = groupPaginationParams.parse(searchParams);

  const {
    expanded,
    cursors,
    limit,
    filter,
    sort,
    search: searchQuery,
  } = params;

  // Convert URL search string to Filter object using property definitions
  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Tabs className="w-full" defaultValue="table">
        <TabsContent value="table">
          <ProductGroupPaginationTable
            cursors={cursors}
            expanded={expanded}
            filter={filter}
            limit={limit}
            search={search}
            sort={sort}
          />
        </TabsContent>
        <TabsContent value="list">
          <ProductGroupPaginationList
            cursors={cursors}
            expanded={expanded}
            filter={filter}
            limit={limit}
            search={search}
            sort={sort}
          />
        </TabsContent>
        <TabsContent value="gallery">
          <ProductGroupPaginationGallery
            cursors={cursors}
            expanded={expanded}
            filter={filter}
            limit={limit}
            search={search}
            sort={sort}
          />
        </TabsContent>
        <TabsContent value="board">
          <ProductSubGroupPaginationBoard
            cursors={cursors}
            filter={filter}
            limit={limit}
            search={search}
            sort={sort}
          />
        </TabsContent>
      </Tabs>
    </HydrationBoundary>
  );
}
