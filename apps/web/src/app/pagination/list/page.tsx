import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { paginationParams } from "@sparkyidea/shared/lib";
import type { SearchParams, WhereNode } from "@sparkyidea/shared/types";
import { buildSearchFilter } from "@sparkyidea/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductPaginationList } from "@/modules/pagination/product-pagination-list";
import { productProperties } from "@/modules/pagination/product-properties";
import { getQueryClient, trpc } from "@/utils/trpc/server";

const VIEW_DEFAULTS: { filter: WhereNode[] } = {
  filter: [],
};

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function PaginationListPage(props: PageProps) {
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
      <ProductPaginationList
        filter={filter}
        limit={limit}
        search={searchQuery}
        sort={sort}
      />
    </HydrationBoundary>
  );
}
