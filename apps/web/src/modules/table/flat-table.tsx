"use client";

import { FLAT_GROUP_KEY, usePagePagination } from "@sparkyidea/dataview/hooks";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  TableSkeleton,
  TableView,
} from "@sparkyidea/dataview/views/table-view";
import { parseAsFilter } from "@sparkyidea/shared/utils/parsers/filter";
import { limitServerParser } from "@sparkyidea/shared/utils/parsers/pagination";
import { parseAsSort } from "@sparkyidea/shared/utils/parsers/sort";
import { parseAsString, useQueryState } from "nuqs";
import {
  type Product,
  productProperties,
} from "@/properties/product-properties";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { bulkActions } from "./bulk-actions";
import { ViewTabs } from "./view-tabs";

/**
 * Flat Table - no grouping, page-based cursor pagination.
 *
 * Uses usePagePagination hook that returns a DataViewProvider
 * with pagination baked in.
 */
export function FlatTable() {
  const trpc = useTRPC();

  // URL params
  const [filter] = useQueryState("filter", parseAsFilter);
  const [sort] = useQueryState("sort", parseAsSort);
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [limit] = useQueryState("limit", limitServerParser);

  const searchableFields = getSearchableProperties(productProperties);
  const searchFilter = buildSearchFilter(search, searchableFields);

  const { DataViewProvider, isPlaceholderData, isLoading, isEmpty } =
    usePagePagination<Product>({
      groupKeys: [FLAT_GROUP_KEY],
      defaultLimit: limit,
      queryOptionsFactory: (_groupKey, cursor, limitParam) =>
        trpc.product.getMany.queryOptions({
          cursor,
          filter,
          limit: limitParam ?? limit,
          search: searchFilter,
          sort: sort ?? [],
        }),
    });

  // DataViewProvider MUST render for queries to execute
  return (
    <DataViewProvider
      filter={filter}
      properties={productProperties}
      search={search}
      sort={sort ?? undefined}
    >
      {isLoading && isEmpty ? (
        // Show skeleton during initial load
        <TableSkeleton columnCount={5} rowCount={10} />
      ) : (
        <>
          <NotionToolbar enableSettings properties={productProperties}>
            <ViewTabs />
          </NotionToolbar>

          <div style={{ opacity: isPlaceholderData ? 0.7 : 1 }}>
            {isEmpty ? (
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
          </div>
        </>
      )}
    </DataViewProvider>
  );
}
