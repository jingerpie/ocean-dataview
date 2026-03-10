"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { Suspense, useCallback, useEffect, useRef } from "react";
import type { GroupedDataItem } from "../../../hooks";
import { useDisplayProperties, useViewSetup } from "../../../hooks";
import type { UseGroupQueryResult } from "../../../hooks/use-group-query";
import type { UseInfiniteGroupQueryResult } from "../../../hooks/use-infinite-group-query";
import { useDataViewContext } from "../../../lib/providers/data-view-context";
import { transformData } from "../../../lib/utils";
import type { DataViewProperty, PaginationContext } from "../../../types";
import { Accordion } from "../../ui/accordion";
import { GroupSection } from "../../ui/group-section";
import { type PaginationMode, renderPagination } from "../../ui/paginations";
import {
  SuspendingGroupContent,
  SuspendingInfiniteGroupContent,
} from "../../ui/suspending-group-content";
import { ListRow } from "./list-row";
import { ListSkeleton } from "./list-skeleton";

export interface ListViewProps<TData> {
  /**
   * Item click handler
   */
  onItemClick?: (item: TData) => void;

  /**
   * Pagination mode for the list.
   * - "page": Classic prev/next pagination with "Showing X-Y"
   * - "loadMore": "Load more" button
   * - "infiniteScroll": Auto-load on scroll
   * - undefined: No pagination UI
   *
   * For grouped lists: renders inside each group
   * For flat lists: renders below the list
   */
  pagination?: PaginationMode;
}

/**
 * ListView with property-based display
 * Auto-generates list item display from properties
 */
export function ListView<
  TData,
  TProperties extends
    readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
>({ onItemClick, pagination }: ListViewProps<TData>) {
  // Get data and properties from context
  const {
    data,
    limit,
    properties,
    propertyVisibility,
    pagination: contextPagination,
    counts,
    group,
    groupKeys,
    expandedGroups,
    onExpandedGroupsChange,
    hasNextGroupPage,
    isFetchingNextGroupPage,
    onLoadMoreGroups,
  } = useDataViewContext<TData, TProperties>();

  // Use shared view setup hook
  const {
    groupedData,
    groupByProperty,
    validationError,
    propertyValidationError,
  } = useViewSetup({
    data: data as TData[],
    properties,
    group,
    contextPagination,
    counts,
  });

  // Use shared hook for display properties filtering
  const displayProperties = useDisplayProperties(
    properties,
    propertyVisibility
  );

  // Determine if we're using infinite pagination for data
  const useInfinitePagination =
    pagination === "loadMore" || pagination === "infiniteScroll";

  // Error state
  if (validationError || propertyValidationError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/5 p-8">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <p className="font-medium text-destructive">
          Invalid list configuration
        </p>
        <p className="mt-2 text-muted-foreground text-sm">
          {validationError || propertyValidationError}
        </p>
      </div>
    );
  }

  // GROUPED VIEW with Per-Group Suspense
  if (group && groupKeys && groupKeys.length > 0) {
    return (
      <div className="flex flex-col">
        <Accordion
          multiple
          onValueChange={onExpandedGroupsChange}
          value={expandedGroups ?? []}
        >
          {groupedData?.map((groupItem: GroupedDataItem<TData>) => {
            const isExpanded = expandedGroups?.includes(groupItem.key) ?? false;

            return (
              <GroupSection
                group={groupItem}
                groupByPropertyDef={groupByProperty}
                key={groupItem.key}
                showAggregation={group.showCount ?? true}
                stickyHeader={{ enabled: true, offset: 57 }}
              >
                {isExpanded ? (
                  <Suspense
                    fallback={
                      <ListSkeleton
                        propertyTypes={displayProperties.map((p) => p.type)}
                        rowCount={limit ?? ListView.defaultLimit}
                      />
                    }
                  >
                    {useInfinitePagination ? (
                      <SuspendingInfiniteListContent<TData, TProperties>
                        displayProperties={displayProperties}
                        groupItem={groupItem}
                        onItemClick={onItemClick}
                        pagination={pagination}
                        properties={properties}
                      />
                    ) : (
                      <SuspendingPageListContent<TData, TProperties>
                        displayProperties={displayProperties}
                        groupItem={groupItem}
                        onItemClick={onItemClick}
                        pagination={pagination}
                        properties={properties}
                      />
                    )}
                  </Suspense>
                ) : null}
              </GroupSection>
            );
          })}
        </Accordion>

        {/* Infinite scroll sentinel for groups */}
        <InfiniteScrollGroupsSentinel
          hasNext={hasNextGroupPage}
          isFetching={isFetchingNextGroupPage}
          onLoadMore={onLoadMoreGroups}
        />
      </div>
    );
  }

  // FLAT VIEW: Uses SuspendingGroupContent with __ungrouped__ key
  return (
    <Suspense
      fallback={
        <ListSkeleton
          pagination={pagination}
          propertyTypes={displayProperties.map((p) => p.type)}
          rowCount={limit ?? ListView.defaultLimit}
        />
      }
    >
      {useInfinitePagination ? (
        <SuspendingInfiniteListContent<TData, TProperties>
          displayProperties={displayProperties}
          groupItem={{
            key: "__ungrouped__",
            items: [],
            count: 0,
            displayCount: "0",
            sortValue: "",
          }}
          onItemClick={onItemClick}
          pagination={pagination}
          properties={properties}
        />
      ) : (
        <SuspendingPageListContent<TData, TProperties>
          displayProperties={displayProperties}
          groupItem={{
            key: "__ungrouped__",
            items: [],
            count: 0,
            displayCount: "0",
            sortValue: "",
          }}
          onItemClick={onItemClick}
          pagination={pagination}
          properties={properties}
        />
      )}
    </Suspense>
  );
}

// Static marker for view type detection in DataViewProvider
ListView.dataViewType = "list" as const;
ListView.defaultLimit = 25;

// ============================================================================
// Suspending Group Content Components
// ============================================================================

interface SuspendingGroupListContentProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  displayProperties: TProperties[number][];
  groupItem: GroupedDataItem<TData>;
  onItemClick?: (item: TData) => void;
  pagination?: PaginationMode;
  properties: TProperties;
}

/**
 * List content renderer - used by both page and infinite pagination variants.
 */
function ListContentRenderer<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  data,
  displayProperties,
  onItemClick,
  paginationNode,
  properties,
}: {
  data: TData[];
  displayProperties: TProperties[number][];
  onItemClick?: (item: TData) => void;
  paginationNode: React.ReactNode;
  properties: TProperties;
}) {
  // Transform data with property definitions
  const transformedItems = transformData(data, properties) as TData[];

  return (
    <>
      <ListRow
        allProperties={properties}
        data={transformedItems}
        displayProperties={displayProperties}
        onItemClick={onItemClick}
      />
      {paginationNode}
    </>
  );
}

/**
 * Page pagination variant - uses useGroupQuery for prev/next navigation.
 */
function SuspendingPageListContent<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  displayProperties,
  groupItem,
  onItemClick,
  pagination,
  properties,
}: SuspendingGroupListContentProps<TData, TProperties>) {
  return (
    <SuspendingGroupContent<TData> groupKey={groupItem.key}>
      {(result: UseGroupQueryResult<TData>) => {
        // Build pagination context from query result
        const paginationContext: PaginationContext = {
          displayEnd: result.displayEnd,
          displayStart: result.displayStart,
          hasMoreThanMax: groupItem.displayCount === "99+",
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
          isFetching: result.isFetching,
          limit: result.limit,
          onLimitChange: result.onLimitChange,
          onNext: result.onNext,
          onPrev: result.onPrev,
          totalCount: groupItem.count,
        };

        return (
          <ListContentRenderer
            data={result.data}
            displayProperties={displayProperties}
            onItemClick={onItemClick}
            paginationNode={renderPagination(pagination, paginationContext)}
            properties={properties}
          />
        );
      }}
    </SuspendingGroupContent>
  );
}

/**
 * Infinite pagination variant - uses useInfiniteGroupQuery for load more / infinite scroll.
 */
function SuspendingInfiniteListContent<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  displayProperties,
  groupItem,
  onItemClick,
  pagination,
  properties,
}: SuspendingGroupListContentProps<TData, TProperties>) {
  return (
    <SuspendingInfiniteGroupContent<TData> groupKey={groupItem.key}>
      {(result: UseInfiniteGroupQueryResult<TData>) => {
        // hasNextPage can be boolean or Record<string, boolean>
        // Convert to simple boolean for PaginationContext
        const hasNext =
          typeof result.hasNextPage === "boolean"
            ? result.hasNextPage
            : Object.values(result.hasNextPage).some(Boolean);

        // Build pagination context from infinite query result
        // Map infinite query properties to PaginationContext
        const paginationContext: PaginationContext = {
          hasMoreThanMax: groupItem.displayCount === "99+",
          hasNext,
          isFetching: result.isFetching,
          isFetchingNextPage: result.isFetchingNextPage,
          limit: result.limit,
          onLimitChange: result.onLimitChange,
          onNext: result.onLoadMore,
          totalCount: groupItem.count,
        };

        return (
          <ListContentRenderer
            data={result.data}
            displayProperties={displayProperties}
            onItemClick={onItemClick}
            paginationNode={renderPagination(pagination, paginationContext)}
            properties={properties}
          />
        );
      }}
    </SuspendingInfiniteGroupContent>
  );
}

// ============================================================================
// Infinite Scroll Groups Sentinel
// ============================================================================

interface InfiniteScrollGroupsSentinelProps {
  hasNext?: boolean;
  isFetching?: boolean;
  onLoadMore?: () => void;
}

function InfiniteScrollGroupsSentinel({
  hasNext,
  isFetching,
  onLoadMore,
}: InfiniteScrollGroupsSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Use refs to avoid stale closures in the intersection observer callback
  const stateRef = useRef({ hasNext, isFetching, onLoadMore });
  stateRef.current = { hasNext, isFetching, onLoadMore };

  const handleIntersect = useCallback(() => {
    const { hasNext, isFetching, onLoadMore } = stateRef.current;
    if (hasNext && !isFetching && onLoadMore) {
      onLoadMore();
    }
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleIntersect();
        }
      },
      {
        rootMargin: "200px",
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersect]);

  if (!(hasNext || isFetching)) {
    return null;
  }

  return (
    <div className="flex items-center justify-center py-4" ref={sentinelRef}>
      {isFetching && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Loading more groups...</span>
        </div>
      )}
    </div>
  );
}
