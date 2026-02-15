import { groupPaginationParams } from "@sparkyidea/shared/lib";
import type { SearchParams } from "@sparkyidea/shared/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductGroupPaginationTable } from "@/modules/group-pagination/product-group-pagination-table";
import { getQueryClient, trpc } from "@/utils/trpc/server";

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function GroupPaginationTablePage(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = groupPaginationParams.parse(searchParams);

  const { expanded, cursors, limit, filter, sort, search } = params;

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "category" })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductGroupPaginationTable
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
