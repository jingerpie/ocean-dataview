"use client";

import type {
  DataViewProperty,
  PaginationContext,
} from "@jingerpie/dataview-core";
import { transformData, UNGROUPED_KEY } from "@jingerpie/dataview-core";
import type {
  GroupedDataItem,
  UseGroupQueryResult,
  UseInfiniteGroupQueryResult,
} from "@jingerpie/dataview-react";
import {
  DEFAULT_LIMIT,
  useDataViewContext,
  useDisplayProperties,
  useViewSetup,
} from "@jingerpie/dataview-react";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import {
  Pagination,
  type PaginationMode,
} from "@/components/dataview/pagination/pagination";
import { GroupSection } from "@/components/dataview/shared/group-section";
import {
  SuspendingGroupContent,
  SuspendingInfiniteGroupContent,
} from "@/components/dataview/shared/suspending-group-content";
import { ListSkeleton } from "@/components/dataview/skeletons/list-skeleton";
import { InfiniteScrollGroupsSentinel } from "@/components/dataview/views/infinite-scroll-groups-sentinel";
import { ListRow } from "@/components/dataview/views/list-view/list-row";
import { Accordion } from "@/components/ui/dataview-accordion";

export interface ListViewProps<TData> {
  /**
   * Additional className for the list wrapper
   */
  className?: string;

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

  /**
   * Show horizontal divider lines between rows
   */
  showHorizontalLines?: boolean;

  /**
   * Sticky header configuration for grouped mode.
   * @default { enabled: false }
   */
  stickyHeader?: { enabled: boolean; offset?: number };
}

/**
 * ListView with property-based display
 * Auto-generates list item display from properties
 */
export function ListView<
  TData,
  TProperties extends
    readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
>({
  className,
  onItemClick,
  pagination,
  showHorizontalLines,
  stickyHeader: stickyHeaderProp,
}: ListViewProps<TData>) {
  const stickyEnabled = stickyHeaderProp?.enabled ?? false;
  const stickyOffset = stickyHeaderProp?.offset ?? 0;
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
                stickyHeader={{ enabled: stickyEnabled, offset: stickyOffset }}
              >
                {isExpanded ? (
                  <Suspense
                    fallback={
                      <ListSkeleton
                        properties={displayProperties}
                        rowCount={limit ?? DEFAULT_LIMIT}
                      />
                    }
                  >
                    {useInfinitePagination ? (
                      <SuspendingInfiniteListContent<TData, TProperties>
                        className={className}
                        displayProperties={displayProperties}
                        groupItem={groupItem}
                        onItemClick={onItemClick}
                        pagination={pagination}
                        properties={properties}
                        showHorizontalLines={showHorizontalLines}
                      />
                    ) : (
                      <SuspendingPageListContent<TData, TProperties>
                        className={className}
                        displayProperties={displayProperties}
                        groupItem={groupItem}
                        onItemClick={onItemClick}
                        pagination={pagination}
                        properties={properties}
                        showHorizontalLines={showHorizontalLines}
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
  // Suspension is caught by the outer Suspense in DataViewProvider
  return useInfinitePagination ? (
    <SuspendingInfiniteListContent<TData, TProperties>
      className={className}
      displayProperties={displayProperties}
      groupItem={{
        key: UNGROUPED_KEY,
        items: [],
        count: 0,
        displayCount: "0",
        sortValue: "",
      }}
      onItemClick={onItemClick}
      pagination={pagination}
      properties={properties}
      showHorizontalLines={showHorizontalLines}
    />
  ) : (
    <SuspendingPageListContent<TData, TProperties>
      className={className}
      displayProperties={displayProperties}
      groupItem={{
        key: UNGROUPED_KEY,
        items: [],
        count: 0,
        displayCount: "0",
        sortValue: "",
      }}
      onItemClick={onItemClick}
      pagination={pagination}
      properties={properties}
      showHorizontalLines={showHorizontalLines}
    />
  );
}

// Static marker for view type detection in DataViewProvider

// ============================================================================
// Suspending Group Content Components
// ============================================================================

interface SuspendingGroupListContentProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  className?: string;
  displayProperties: TProperties[number][];
  groupItem: GroupedDataItem<TData>;
  onItemClick?: (item: TData) => void;
  pagination?: PaginationMode;
  properties: TProperties;
  showHorizontalLines?: boolean;
}

/**
 * List content renderer - used by both page and infinite pagination variants.
 */
function ListContentRenderer<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  className,
  data,
  displayProperties,
  onItemClick,
  paginationNode,
  properties,
  showHorizontalLines,
}: {
  className?: string;
  data: TData[];
  displayProperties: TProperties[number][];
  onItemClick?: (item: TData) => void;
  paginationNode: React.ReactNode;
  properties: TProperties;
  showHorizontalLines?: boolean;
}) {
  // Transform data with property schema
  const transformedItems = transformData(data, properties) as TData[];

  return (
    <div className={cn("overflow-clip", className)}>
      <ListRow
        allProperties={properties}
        data={transformedItems}
        displayProperties={displayProperties}
        onItemClick={onItemClick}
        showHorizontalLines={showHorizontalLines}
      />
      {paginationNode}
    </div>
  );
}

/**
 * Page pagination variant - uses useGroupQuery for prev/next navigation.
 */
function SuspendingPageListContent<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  className,
  displayProperties,
  groupItem,
  onItemClick,
  pagination,
  properties,
  showHorizontalLines,
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
            className={className}
            data={result.data}
            displayProperties={displayProperties}
            onItemClick={onItemClick}
            paginationNode={
              <Pagination context={paginationContext} mode={pagination} />
            }
            properties={properties}
            showHorizontalLines={showHorizontalLines}
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
  className,
  displayProperties,
  groupItem,
  onItemClick,
  pagination,
  properties,
  showHorizontalLines,
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
            className={className}
            data={result.data}
            displayProperties={displayProperties}
            onItemClick={onItemClick}
            paginationNode={
              <Pagination context={paginationContext} mode={pagination} />
            }
            properties={properties}
            showHorizontalLines={showHorizontalLines}
          />
        );
      }}
    </SuspendingInfiniteGroupContent>
  );
}
