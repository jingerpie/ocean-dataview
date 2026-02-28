"use client";

import {
  useInfinitePagination,
  usePaginationState,
} from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { ListSkeleton, ListView } from "@sparkyidea/dataview/views/list-view";
import type { WhereNode } from "@sparkyidea/shared/types";
import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import type { GroupConfigInput } from "@sparkyidea/shared/utils/parsers/group";
import { productProperties } from "@/properties/product-properties";
import { combineGroupFilter, getGroupProperty } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { ViewTabs } from "./view-tabs";

interface HybridListProps {
  expanded: string[];
  filter: WhereNode[] | null;
  group: GroupConfigInput | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
  subGroup: GroupConfigInput | null;
}

/**
 * Hybrid List - auto flat/grouped based on URL group param.
 *
 * Uses useInfinitePagination hook with groupQueryOptionsFactory for internal group fetching.
 * QueryBridge handles group data fetching and stale data detection automatically.
 */
export function HybridList({
  expanded,
  filter,
  group,
  limit,
  search,
  sort,
  subGroup,
}: HybridListProps) {
  const trpc = useTRPC();

  const searchableFields = getSearchableProperties(productProperties);

  // Get property label for toolbar display
  const groupProperty = getGroupProperty(group);
  const propertyMeta = productProperties.find((p) => p.id === groupProperty);
  const groupPropertyLabel = propertyMeta?.label ?? groupProperty ?? "";

  const { pagination } = useInfinitePagination({
    // Factory for group counts - called internally by QueryBridge when group is set
    groupQueryOptionsFactory: (groupConfig) =>
      trpc.product.getGroup.queryOptions({
        groupBy: groupConfig,
      }),

    // Factory for data items - receives groupConfig from internal state
    queryOptionsFactory: (params) =>
      trpc.product.getMany.infiniteQueryOptions(
        {
          filter:
            params.groupConfig && params.groupKey
              ? combineGroupFilter(
                  params.groupConfig,
                  params.groupKey,
                  params.filter
                )
              : params.filter,
          search: buildSearchFilter(params.search, searchableFields),
          sort: params.sort ?? [],
          limit: params.limit,
        },
        {
          getNextPageParam: (lastPage) =>
            lastPage.hasNextPage ? lastPage.endCursor : undefined,
        }
      ),
  });

  // Add view options to group config
  const groupConfigForView = group ? { ...group, showCount: true } : undefined;

  return (
    <DataViewProvider
      defaults={{
        expanded: expanded.length > 0 ? expanded : undefined,
        filter,
        group: groupConfigForView,
        limit,
        search,
        sort: sort ?? [],
        subGroup,
      }}
      pagination={pagination}
      properties={productProperties}
    >
      <HybridListContent
        groupPropertyLabel={group ? groupPropertyLabel : undefined}
      />
    </DataViewProvider>
  );
}

interface HybridListContentProps {
  groupPropertyLabel?: string;
}

/**
 * HybridListContent - Inner content component that accesses loading states.
 *
 * Uses usePaginationState() to get loading states from context.
 * Group loading is now handled internally by QueryBridge.
 */
function HybridListContent({ groupPropertyLabel }: HybridListContentProps) {
  const { isLoading, isEmpty, isPlaceholderData } = usePaginationState();

  if (isLoading && isEmpty) {
    return <ListSkeleton rowCount={8} />;
  }

  return (
    <>
      <NotionToolbar
        enableSettings
        groupProperty={groupPropertyLabel}
        properties={productProperties}
      >
        <ViewTabs />
      </NotionToolbar>

      <div style={{ opacity: isPlaceholderData ? 0.7 : 1 }}>
        {isEmpty ? (
          <div className="flex min-h-100 items-center justify-center">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <ListView pagination="loadMore" />
        )}
      </div>
    </>
  );
}
