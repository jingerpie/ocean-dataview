import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { paginationParams } from "@sparkyidea/shared/lib";
import type { SearchParams, WhereNode } from "@sparkyidea/shared/types";
import { buildSearchFilter } from "@sparkyidea/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductPaginationGallery } from "@/modules/pagination/product-pagination-gallery";
import { productProperties } from "@/modules/pagination/product-properties";
import { getQueryClient, trpc } from "@/utils/trpc/server";

const VIEW_DEFAULTS: { filter: WhereNode[] } = {
  filter: [],
};

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function PaginationGalleryPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = paginationParams.parse(searchParams);

  const cursor = params.cursor ?? null;
  const limit = params.limit;
  const filter = params.filter ?? VIEW_DEFAULTS.filter;
  const sort = params.sort;
  const searchQuery = params.search ?? "";

  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(
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
      <ProductPaginationGallery
        filter={filter}
        limit={limit}
        search={searchQuery}
        sort={sort}
      />
    </HydrationBoundary>
  );
}
