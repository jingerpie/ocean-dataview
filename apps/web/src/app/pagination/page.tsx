import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { paginationParams } from "@sparkyidea/shared/lib";
import type { SearchParams, WhereNode } from "@sparkyidea/shared/types";
import { buildSearchFilter } from "@sparkyidea/shared/utils";
import { Tabs, TabsContent } from "@sparkyidea/ui/components/tabs";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductGroupPaginationBoard } from "@/modules/pagination/product-group-pagination-board";
import { ProductPaginationGallery } from "@/modules/pagination/product-pagination-gallery";
import { ProductPaginationList } from "@/modules/pagination/product-pagination-list";
import { ProductPaginationTable } from "@/modules/pagination/product-pagination-table";
import { productProperties } from "@/modules/pagination/product-properties";
import { getQueryClient, trpc } from "@/utils/trpc/server";

/**
 * Default values for the pagination view when URL params are empty.
 * These are applied server-side before prefetch and passed to client.
 */
const VIEW_DEFAULTS: { filter: WhereNode[] } = {
  filter: [],
};

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function PaginationPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = paginationParams.parse(searchParams);

  // Apply defaults when URL params are missing
  const cursor = params.cursor ?? null;
  const limit = params.limit;
  const filter = params.filter ?? VIEW_DEFAULTS.filter;
  const sort = params.sort;
  const searchQuery = params.search ?? "";

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
      search,
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
            search={searchQuery}
            sorts={sort}
          />
        </TabsContent>
        <TabsContent value="list">
          <ProductPaginationList
            filter={filter}
            limit={limit}
            search={searchQuery}
            sort={sort}
          />
        </TabsContent>
        <TabsContent value="gallery">
          <ProductPaginationGallery
            filter={filter}
            limit={limit}
            search={searchQuery}
            sort={sort}
          />
        </TabsContent>
        <TabsContent value="board">
          <ProductGroupPaginationBoard
            filter={filter}
            limit={limit}
            search={searchQuery}
            sort={sort}
          />
        </TabsContent>
      </Tabs>
    </HydrationBoundary>
  );
}
