"use client";

import { usePagePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { TableView } from "@sparkyidea/dataview/views/table-view";
import type { WhereNode } from "@sparkyidea/shared/types";
import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import { productProperties } from "@/properties/product-properties";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { bulkActions } from "./bulk-actions";

interface FlatTableProps {
  filter: WhereNode[] | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
}

/**
 * Flat Table - no grouping, page-based cursor pagination.
 *
 * NotionToolbar uses context from DataViewProvider (never suspends).
 * TableView may suspend while loading data.
 */
export function FlatTable({ filter, sort, search, limit }: FlatTableProps) {
  const trpc = useTRPC();
  const searchableFields = getSearchableProperties(productProperties);

  const { pagination } = usePagePagination({
    queryOptionsFactory: (params) =>
      trpc.product.getMany.queryOptions({
        ...(params.cursor ? { cursor: params.cursor } : {}),
        filter: params.filter,
        limit: params.limit,
        search: buildSearchFilter(params.search, searchableFields),
        sort: params.sort ?? [],
      }),
  });

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
      <NotionToolbar enableSettings />
      <TableView
        bulkActions={bulkActions}
        pagination="page"
        showVerticalLines={false}
        wrapAllColumns={false}
      />
    </DataViewProvider>
  );
}
