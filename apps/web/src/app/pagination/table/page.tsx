import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { paginationParams } from "@sparkyidea/shared/lib";
import type { SearchParams, WhereNode } from "@sparkyidea/shared/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductPaginationTable } from "@/modules/pagination/product-pagination-table";
import { productProperties } from "@/modules/pagination/product-properties";
import { buildSearchFilter } from "@/utils/search";
import { getQueryClient, trpc } from "@/utils/trpc/server";

const VIEW_DEFAULTS: { filter: WhereNode[] } = {
  filter: [],
};

// Flat mode uses "__all__" as the single group key
const FLAT_GROUP_KEY = "__all__";

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function PaginationTablePage(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = paginationParams.parse(searchParams);

  // Convert single cursor to cursors format for flat mode
  const cursor = params.cursor ?? null;
  const cursors = cursor ? { [FLAT_GROUP_KEY]: cursor } : undefined;

  const limit = params.limit;
  const filter = params.filter ?? VIEW_DEFAULTS.filter;
  const sort = params.sort;
  const searchQuery = params.search ?? "";

  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);

  const queryClient = getQueryClient();

  // Prefetch for flat mode (single "__all__" group)
  void queryClient.prefetchQuery(
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
      <ProductPaginationTable
        cursors={cursors}
        filter={filter}
        limit={limit}
        search={searchQuery}
        sort={sort}
      />
    </HydrationBoundary>
  );
}
