"use client";

import { usePagePagination } from "@sparkyidea/dataview/hooks";
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
import { buildSearchFilter } from "@sparkyidea/shared/utils";
import { Suspense } from "react";
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
  sorts?: SortQuery[];
}

/**
 * Product Table with simple cursor-based pagination.
 *
 * Pattern: Uses usePagePagination (flat mode)
 * - Props are passed to DataViewProvider defaults
 * - Hooks read from defaults (server props), write to URL
 */
export function ProductPaginationTable(props: PaginationProps) {
  const {
    cursors = {},
    limit,
    filter = null,
    search: searchQuery = "",
    sorts = [],
  } = props;
  const trpc = useTRPC();

  // Build search filter from raw search string
  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);

  // Use unified hook for pagination state (flat mode)
  const { data, pagination } = usePagePagination({
    limit,
    cursors,
    queryOptions: (_groupKey, cursor) =>
      trpc.product.getMany.queryOptions({
        cursor,
        limit,
        filter,
        search,
        sort: sorts,
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
        sort={sorts}
      >
        <NotionToolbar enableSettings properties={productProperties}>
          <ViewNav />
        </NotionToolbar>
        <TableView
          bulkActions={sampleRowActions}
          pagination="page"
          showVerticalLines={false}
          wrapAllColumns={false}
        />
      </DataViewProvider>
    </Suspense>
  );
}
