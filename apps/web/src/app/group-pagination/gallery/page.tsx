import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { groupPaginationParams } from "@sparkyidea/shared/lib";
import type { SearchParams } from "@sparkyidea/shared/types";
import {
  buildSearchFilter,
  combineGroupFilter,
} from "@sparkyidea/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductGroupPaginationGallery } from "@/modules/group-pagination/product-group-pagination-gallery";
import { productProperties } from "@/modules/group-pagination/product-properties";
import { getQueryClient, trpc } from "@/utils/trpc/server";

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function GroupPaginationGalleryPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = groupPaginationParams.parse(searchParams);

  const { expanded, limit, filter, sort, search: searchQuery } = params;

  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery ?? "", searchableFields);

  const queryClient = getQueryClient();

  // Prefetch group counts
  void queryClient.prefetchQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "category" })
  );

  // Prefetch infinite query for each expanded group (must match client options)
  for (const groupKey of expanded) {
    void queryClient.prefetchInfiniteQuery(
      trpc.product.getMany.infiniteQueryOptions(
        {
          filter: combineGroupFilter("category", groupKey, filter),
          search,
          sort,
          limit,
        },
        {
          getNextPageParam: (lastPage) =>
            lastPage.hasNextPage ? lastPage.endCursor : undefined,
        }
      )
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductGroupPaginationGallery
        expanded={expanded}
        filter={filter}
        limit={limit}
        search={searchQuery}
        sort={sort}
      />
    </HydrationBoundary>
  );
}
