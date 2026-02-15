import { groupPaginationParams } from "@sparkyidea/shared/lib";
import type { SearchParams } from "@sparkyidea/shared/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductGroupPaginationList } from "@/modules/group-pagination/product-group-pagination-list";
import { getQueryClient, trpc } from "@/utils/trpc/server";

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function GroupPaginationListPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = groupPaginationParams.parse(searchParams);

  const { expanded, cursors, limit, filter, sort, search } = params;

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "category" })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductGroupPaginationList
        cursors={cursors}
        expanded={expanded}
        filter={filter}
        limit={limit}
        search={search}
        sort={sort}
      />
    </HydrationBoundary>
  );
}
