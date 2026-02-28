"use client";

import {
  usePagePagination,
  usePaginationState,
} from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  TableSkeleton,
  TableView,
} from "@sparkyidea/dataview/views/table-view";
import type { WhereNode } from "@sparkyidea/shared/types";
import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import { productProperties } from "@/properties/product-properties";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { bulkActions } from "./bulk-actions";
import { ViewTabs } from "./view-tabs";

interface FlatTableProps {
  filter: WhereNode[] | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
}

/**
 * Flat Table - no grouping, page-based cursor pagination.
 *
 * Uses usePagePagination hook that returns a DataViewProvider
 * with pagination baked in.
 */
export function FlatTable({ filter, sort, search, limit }: FlatTableProps) {
  const trpc = useTRPC();

  const searchableFields = getSearchableProperties(productProperties);

  const { pagination } = usePagePagination({
    queryOptionsFactory: (params) =>
      trpc.product.getMany.queryOptions({
        // Wrap cursor in __ungrouped__ key for unified cursors format
        cursors: params.cursor ? { __ungrouped__: params.cursor } : undefined,
        filter: params.filter,
        limit: params.limit,
        search: buildSearchFilter(params.search, searchableFields),
        sort: params.sort ?? [],
      }),
  });

  // DataViewProvider MUST render for queries to execute
  return (
    <DataViewProvider
      defaults={{
        filter,
        limit,
        search,
        sort: sort ?? [],
      }}
      pagination={pagination}
      properties={productProperties}
    >
      <FlatTableContent />
    </DataViewProvider>
  );
}

/**
 * FlatTableContent - Inner content component that accesses loading states.
 *
 * Uses usePaginationState() to get loading states from context.
 */
function FlatTableContent() {
  const { isLoading, isEmpty, isPlaceholderData } = usePaginationState();

  if (isLoading && isEmpty) {
    // Show skeleton during initial load
    return <TableSkeleton columnCount={5} rowCount={10} />;
  }

  return (
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
  );
}
