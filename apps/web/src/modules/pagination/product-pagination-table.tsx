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
  CursorValue,
  SortQuery,
  WhereNode,
} from "@sparkyidea/shared/types";
import { buildSearchFilter } from "@sparkyidea/shared/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { productProperties } from "./product-properties";
import { ViewNav } from "./view-nav";

/**
 * Props passed from server (with defaults already applied)
 */
interface PaginationProps {
  cursor?: CursorValue | null;
  limit: number;
  filter?: WhereNode[] | null;
  /** Raw search string from URL (for UI display) */
  search?: string;
  sorts?: SortQuery[];
}

/**
 * Product Table with simple cursor-based pagination.
 *
 * Pattern: Server prefetch → Props → Client uses props for query
 * - Server parses URL, applies defaults, prefetches, passes props
 * - Client uses useSuspenseQuery with props (matches server prefetch = cache hit)
 * - Props are passed to DataViewProvider defaults
 * - Hooks read from defaults (server props), write to URL
 */
export function ProductPaginationTable(props: PaginationProps) {
  const {
    cursor = null,
    limit,
    filter = null,
    search: searchQuery = "",
    sorts = [],
  } = props;
  const trpc = useTRPC();

  // Build search filter from raw search string
  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);

  // Query with props directly - MUST match server prefetch for cache hit
  const { data } = useSuspenseQuery(
    trpc.product.getMany.queryOptions({
      cursor,
      limit,
      filter,
      search,
      sort: sorts,
    })
  );

  // Pagination controls
  const pagination = usePagePagination({
    cursor,
    limit,
    data,
    limitOptions: [10, 25, 50, 100],
  });

  return (
    <Suspense fallback={<TableSkeleton columnCount={5} rowCount={10} />}>
      <DataViewProvider
        data={data.items}
        defaults={{
          filter,
          sort: sorts,
          search: searchQuery,
        }}
        pagination={pagination}
        properties={productProperties}
      >
        <NotionToolbar properties={productProperties}>
          <ViewNav />
        </NotionToolbar>
        <TableView
          layout={{ showVerticalLines: true, wrapAllColumns: false }}
          pagination="page"
        />
      </DataViewProvider>
    </Suspense>
  );
}
