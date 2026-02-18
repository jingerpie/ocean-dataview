import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { groupPaginationParams } from "@sparkyidea/shared/lib";
import type { SearchParams } from "@sparkyidea/shared/types";
import {
  buildSearchFilter,
  combineGroupFilter,
} from "@sparkyidea/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { productProperties } from "@/modules/group-pagination/product-properties";
import { ProductSubGroupPaginationBoard } from "@/modules/group-pagination/product-sub-group-pagination-board";
import { getQueryClient, trpc } from "@/utils/trpc/server";

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function GroupPaginationBoardPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = groupPaginationParams.parse(searchParams);

  const { expanded, limit, filter, sort, search: searchQuery } = params;

  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery ?? "", searchableFields);

  const queryClient = getQueryClient();

  // Prefetch group counts for columns (category) and rows (availability)
  void queryClient.prefetchQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "category" })
  );
  void queryClient.prefetchQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "availability" })
  );

  // Prefetch infinite query for each expanded sub-group (must match client options)
  for (const subGroupKey of expanded ?? []) {
    void queryClient.prefetchInfiniteQuery(
      trpc.product.getManyByGroup.infiniteQueryOptions(
        {
          groupBy: "category",
          filter: combineGroupFilter("availability", subGroupKey, filter),
          search,
          sort,
          limit,
        },
        {
          getNextPageParam: (lastPage) => {
            const hasAnyMore = Object.values(lastPage.hasNextPage).some(
              Boolean
            );
            if (!hasAnyMore) {
              return undefined;
            }
            return Object.fromEntries(
              Object.entries(lastPage.nextCursor).filter(
                (entry): entry is [string, string] => entry[1] !== null
              )
            );
          },
        }
      )
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductSubGroupPaginationBoard
        expanded={expanded}
        filter={filter}
        limit={limit}
        search={searchQuery}
        sort={sort}
      />
    </HydrationBoundary>
  );
}
