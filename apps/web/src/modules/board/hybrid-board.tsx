"use client";

import { useInfinitePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { BoardView } from "@sparkyidea/dataview/views/board-view";
import type { WhereNode } from "@sparkyidea/shared/types";
import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import type { ColumnConfigInput } from "@sparkyidea/shared/utils/parsers/column";
import type { GroupConfigInput } from "@sparkyidea/shared/utils/parsers/group";
import { useQuery } from "@tanstack/react-query";
import { productProperties } from "@/properties/product-properties";
import { getGroupProperty } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";

interface HybridBoardProps {
  /** Column configuration (board columns) */
  column: ColumnConfigInput | null;
  filter: WhereNode[] | null;
  /** Group configuration (board rows/accordion) */
  group: GroupConfigInput | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
}

/**
 * Hybrid Board - auto flat/grouped based on column param.
 *
 * NotionToolbar uses context from DataViewProvider (never suspends).
 * BoardView may suspend while loading data.
 */
export function HybridBoard({
  column,
  filter,
  group,
  limit,
  search,
  sort,
}: HybridBoardProps) {
  const trpc = useTRPC();

  const columnProperty = getGroupProperty(column);
  const groupProperty = getGroupProperty(group);
  const isGrouped = Boolean(group && groupProperty);

  const searchableFields = getSearchableProperties(productProperties);

  // Default column config for boards (always need columns)
  const defaultColumnConfig = { bySelect: { property: "category" } } as const;
  const effectiveColumnConfig = column ?? defaultColumnConfig;
  const effectiveColumnProperty = columnProperty ?? "category";

  // Fetch column counts separately (board-specific)
  // This provides columnCounts for BoardView to build columns
  const columnCountsQuery = useQuery(
    trpc.product.getGroup.queryOptions({ groupBy: effectiveColumnConfig })
  );

  const { pagination } = useInfinitePagination({
    // Factory for accordion row counts - only when group is configured
    groupQueryOptionsFactory: isGrouped
      ? (groupConfig) =>
          trpc.product.getGroup.queryOptions({ groupBy: groupConfig })
      : undefined,

    // Factory for data items - fetches ALL columns in one query
    queryOptionsFactory: (params) =>
      trpc.product.getManyByColumn.infiniteQueryOptions(
        {
          columnBy: effectiveColumnConfig,
          limit: params.limit,
          filter: params.filter,
          sort: params.sort ?? [],
          search: buildSearchFilter(params.search, searchableFields),
        },
        {
          getNextPageParam: (lastPage) => {
            const hasAnyMore = Object.values(lastPage.hasNextPage).some(
              Boolean
            );
            if (!hasAnyMore) {
              return undefined;
            }
            return Object.fromEntries(
              Object.entries(lastPage.endCursor).map(([key, cursor]) => [
                key,
                cursor,
              ])
            );
          },
        }
      ),
  });

  // Prepare view configs and labels
  const columnConfigForView = { ...effectiveColumnConfig, showCount: true };
  const groupConfigForView = group ? { ...group, showCount: true } : undefined;

  // Get column property label for toolbar display (board-specific)
  const columnPropertyMeta = productProperties.find(
    (p) => p.id === effectiveColumnProperty
  );
  const columnPropertyLabel =
    columnPropertyMeta?.label ?? effectiveColumnProperty;

  return (
    <DataViewProvider
      columnCounts={columnCountsQuery.data?.counts}
      defaults={{
        column: columnConfigForView,
        filter,
        group: groupConfigForView,
        limit,
        search,
        sort: sort ?? [],
      }}
      pagination={pagination}
      properties={productProperties}
    >
      <NotionToolbar columnProperty={columnPropertyLabel} enableSettings />
      <BoardView
        cardPreview="productImage"
        cardSize="medium"
        colorColumns
        fitMedia
        pagination="loadMore"
      />
    </DataViewProvider>
  );
}
