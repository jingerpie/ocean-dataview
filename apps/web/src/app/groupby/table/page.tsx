import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { paginationParams } from "@sparkyidea/shared/lib";
import type { SearchParams } from "@sparkyidea/shared/types";
import { buildSearchFilter } from "@sparkyidea/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductGroupByTable } from "@/modules/groupby/product-groupby-table";
import { productProperties } from "@/modules/groupby/product-properties";
import { getQueryClient, trpc } from "@/utils/trpc/server";

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function GroupByTablePage(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = paginationParams.parse(searchParams);

  const limit = params.limit;
  const filter = params.filter ?? null;
  const sort = params.sort;
  const searchQuery = params.search ?? "";

  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);

  const queryClient = getQueryClient();

  // Prefetch initial data
  void queryClient.prefetchInfiniteQuery(
    trpc.product.getMany.infiniteQueryOptions(
      {
        limit,
        filter,
        sort,
        search,
      },
      {
        getNextPageParam: (lastPage) =>
          lastPage.hasNextPage ? lastPage.endCursor : undefined,
      }
    )
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductGroupByTable
        filter={filter}
        limit={limit}
        search={searchQuery}
        sort={sort}
      />
    </HydrationBoundary>
  );
}
