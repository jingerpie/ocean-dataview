"use client";

import { usePagePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  TableSkeleton,
  TableView,
} from "@sparkyidea/dataview/views/table-view";
import { parseAsFilter } from "@sparkyidea/shared/utils/parsers/filter";
import {
  limitServerParser,
  parseAsCursors,
} from "@sparkyidea/shared/utils/parsers/pagination";
import { parseAsSort } from "@sparkyidea/shared/utils/parsers/sort";
import { parseAsString, useQueryState } from "nuqs";
import { productProperties } from "@/properties/product-properties";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { bulkActions } from "./bulk-actions";
import { ViewTabs } from "./view-tabs";

/**
 * Flat Table - no grouping, page-based cursor pagination.
 *
 * Self-contained component that reads URL params directly via nuqs.
 */
export function FlatTable() {
  const trpc = useTRPC();

  // Read URL params directly via nuqs
  const [filter] = useQueryState("filter", parseAsFilter);
  const [sort] = useQueryState("sort", parseAsSort);
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [limit] = useQueryState("limit", limitServerParser);
  const [cursors] = useQueryState("cursors", parseAsCursors.withDefault({}));

  // Build search filter from raw search string
  const searchableFields = getSearchableProperties(productProperties);
  const searchFilter = buildSearchFilter(search, searchableFields);

  // Use unified hook for pagination state (flat mode)
  const { data, pagination } = usePagePagination({
    limit,
    cursors,
    queryOptions: (_groupKey, cursor) =>
      trpc.product.getMany.queryOptions({
        cursor,
        limit,
        filter,
        search: searchFilter,
        sort: sort ?? [],
      }),
  });

  // Show skeleton on initial load
  if (pagination.isLoading && data.length === 0) {
    return <TableSkeleton columnCount={5} rowCount={10} />;
  }

  return (
    <DataViewProvider
      data={data}
      filter={filter}
      pagination={pagination}
      properties={productProperties}
      search={search}
      sort={sort ?? []}
    >
      <NotionToolbar enableSettings properties={productProperties}>
        <ViewTabs />
      </NotionToolbar>

      {data.length === 0 ? (
        <div className="flex min-h-100 items-center justify-center">
          <p className="text-muted-foreground">No products found</p>
        </div>
      ) : (
        <TableView
          bulkActions={bulkActions}
          pagination="page"
          showVerticalLines={false}
          wrapAllColumns={false}
        />
      )}
    </DataViewProvider>
  );
}
