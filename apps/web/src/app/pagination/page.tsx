import { getSearchableProperties } from "@ocean-dataview/dataview/types";
import { paginationParams } from "@ocean-dataview/shared/lib";
import { buildSearchFilter } from "@ocean-dataview/shared/utils";
import { Tabs, TabsContent } from "@ocean-dataview/ui/components/tabs";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductGroupPaginationBoard } from "@/modules/pagination/product-group-pagination-board";
import { ProductPaginationGallery } from "@/modules/pagination/product-pagination-gallery";
import { ProductPaginationList } from "@/modules/pagination/product-pagination-list";
import { ProductPaginationTable } from "@/modules/pagination/product-pagination-table";
import { productProperties } from "@/modules/pagination/product-properties";
import { getQueryClient, trpc } from "@/utils/trpc/server";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PaginationPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = paginationParams.parse(searchParams);

  const { cursor, limit, filter, sort, search: searchQuery } = params;

  // Convert URL search string to Filter object using property definitions
  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(
    trpc.product.getMany.queryOptions({
      cursor,
      limit,
      filter,
      sort,
      search, // Pass search separately, tRPC handles merge
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Tabs className="w-full" defaultValue="table" id="pagination-tabs">
        <TabsContent value="table">
          <ProductPaginationTable
            cursor={cursor}
            filter={filter}
            limit={limit}
            search={search}
            sorts={sort ?? []}
          />
        </TabsContent>
        <TabsContent value="list">
          <ProductPaginationList
            filter={filter}
            limit={limit}
            search={search}
            sort={sort}
          />
        </TabsContent>
        <TabsContent value="gallery">
          <ProductPaginationGallery
            filter={filter}
            limit={limit}
            search={search}
            sort={sort}
          />
        </TabsContent>
        <TabsContent value="board">
          <ProductGroupPaginationBoard
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
