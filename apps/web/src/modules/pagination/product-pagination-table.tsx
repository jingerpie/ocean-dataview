"use client";

import { useSuspensePagePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  TableSkeleton,
  TableView,
} from "@sparkyidea/dataview/views/table-view";
import type {
  Cursors,
  Limit,
  SortQuery,
  WhereNode,
} from "@sparkyidea/shared/types";
import { Suspense } from "react";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { productProperties } from "./product-properties";
import { sampleRowActions } from "./sample-row-actions";
import { ViewNav } from "./view-nav";

/**
 * Props passed from server (with defaults already applied)
 */
interface PaginationProps {
  cursors?: Cursors;
  filter?: WhereNode[] | null;
  limit: Limit;
  /** Raw search string from URL (for UI display) */
  search?: string;
  sort?: SortQuery[];
}

/**
 * Product Table with page-based cursor pagination.
 *
 * Pattern: Uses useSuspensePagePagination (flat mode)
 * - Server prefetches data with same query options
 * - Client uses useSuspensePagePagination for cache hit
 * - Props are passed to DataViewProvider defaults
 * - Hooks read from defaults (server props), write to URL
 */
export function ProductPaginationTable({
  cursors = {},
  limit,
  filter = null,
  search: searchQuery = "",
  sort = [],
}: PaginationProps) {
  const trpc = useTRPC();

  // Build search filter from raw search string
  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);

  // Use unified hook for pagination state (flat mode)
  const { data, pagination } = useSuspensePagePagination({
    limit,
    cursors,
    queryOptions: (_groupKey, cursor) =>
      trpc.product.getMany.queryOptions({
        cursor,
        limit,
        filter,
        search,
        sort,
      }),
  });

  return (
    <Suspense fallback={<TableSkeleton columnCount={5} rowCount={10} />}>
      <DataViewProvider
        data={data}
        filter={filter}
        pagination={pagination}
        properties={productProperties}
        search={searchQuery}
        sort={sort}
      >
        <NotionToolbar enableSettings properties={productProperties}>
          <ViewNav />
        </NotionToolbar>

        {data.length === 0 ? (
          <div className="flex min-h-100 items-center justify-center">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <TableView
            bulkActions={sampleRowActions}
            pagination="page"
            showVerticalLines={false}
            wrapAllColumns={false}
          />
        )}
      </DataViewProvider>
    </Suspense>
  );
}
