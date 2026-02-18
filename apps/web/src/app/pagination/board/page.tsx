import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { paginationParams } from "@sparkyidea/shared/lib";
import type { SearchParams } from "@sparkyidea/shared/types";
import { buildSearchFilter } from "@sparkyidea/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductGroupPaginationBoard } from "@/modules/pagination/product-group-pagination-board";
import { productProperties } from "@/modules/pagination/product-properties";
import { getQueryClient, trpc } from "@/utils/trpc/server";

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function PaginationBoardPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = paginationParams.parse(searchParams);

  const { limit, filter, sort, search: searchQuery } = params;

  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery ?? "", searchableFields);

  const queryClient = getQueryClient();

  // Prefetch group counts (for column headers)
  void queryClient.prefetchQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "category" })
  );

  // Prefetch getManyByGroup infinite query (flat data, client-side grouping)
  void queryClient.prefetchInfiniteQuery(
    trpc.product.getManyByGroup.infiniteQueryOptions(
      {
        groupBy: "category",
        limit,
        filter,
        sort,
        search,
      },
      {
        getNextPageParam: (lastPage) => {
          const hasAnyMore = Object.values(lastPage.hasNextPage).some(Boolean);
          if (!hasAnyMore) {
            return undefined;
          }
          // Relay pattern: use endCursor where hasNextPage is true
          return Object.fromEntries(
            Object.entries(lastPage.hasNextPage)
              .filter(([key, hasMore]) => hasMore && lastPage.endCursor[key])
              .map(([key]) => [key, lastPage.endCursor[key] as string])
          );
        },
      }
    )
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductGroupPaginationBoard
        filter={filter}
        limit={limit}
        search={searchQuery}
        sort={sort}
      />
    </HydrationBoundary>
  );
}
