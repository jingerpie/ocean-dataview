import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { groupPaginationParams } from "@sparkyidea/shared/lib";
import { buildSearchFilter } from "@sparkyidea/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductGroupPaginationList } from "@/modules/group-pagination/product-group-pagination-list";
import { productProperties } from "@/modules/group-pagination/product-properties";
import { getQueryClient, trpc } from "@/utils/trpc/server";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GroupPaginationListPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = groupPaginationParams.parse(searchParams);

  const {
    expanded,
    cursors,
    limit,
    filter,
    sort,
    search: searchQuery,
  } = params;

  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(
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
