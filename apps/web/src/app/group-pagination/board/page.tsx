import { groupPaginationParams } from "@sparkyidea/shared/lib";
import type { SearchParams } from "@sparkyidea/shared/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductSubGroupPaginationBoard } from "@/modules/group-pagination/product-sub-group-pagination-board";
import { getQueryClient, trpc } from "@/utils/trpc/server";

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function GroupPaginationBoardPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = groupPaginationParams.parse(searchParams);

  const { expanded, limit, filter, sort, search } = params;

  const queryClient = getQueryClient();

  // Prefetch group counts for columns (category) and rows (availability)
  void queryClient.prefetchQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "category" })
  );
  void queryClient.prefetchQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "availability" })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductSubGroupPaginationBoard
        expanded={expanded}
        filter={filter}
        limit={limit}
        search={search}
        sort={sort}
      />
    </HydrationBoundary>
  );
}
