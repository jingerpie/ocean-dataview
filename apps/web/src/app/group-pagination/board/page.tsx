import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { groupPaginationParams } from "@sparkyidea/shared/lib";
import { buildSearchFilter } from "@sparkyidea/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { productProperties } from "@/modules/group-pagination/product-properties";
import { ProductSubGroupPaginationBoard } from "@/modules/group-pagination/product-sub-group-pagination-board";
import { getQueryClient, trpc } from "@/utils/trpc/server";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GroupPaginationBoardPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = groupPaginationParams.parse(searchParams);

  const { cursors, limit, filter, sort, search: searchQuery } = params;

  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "category" })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductSubGroupPaginationBoard
        cursors={cursors}
        filter={filter}
        limit={limit}
        search={search}
        sort={sort}
      />
    </HydrationBoundary>
  );
}
