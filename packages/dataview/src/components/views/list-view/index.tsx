"use client";

import { AlertCircle } from "lucide-react";
import { Suspense } from "react";
import type { GroupedDataItem } from "../../../hooks";
import { useDisplayProperties, useViewSetup } from "../../../hooks";
import type { UseGroupQueryResult } from "../../../hooks/use-group-query";
import { useDataViewContext } from "../../../lib/providers/data-view-context";
import { cn, transformData } from "../../../lib/utils";
import type { DataViewProperty, PaginationContext } from "../../../types";
import { Accordion } from "../../ui/accordion";
import { GroupSection } from "../../ui/group-section";
import { type PaginationMode, renderPagination } from "../../ui/paginations";
import { SuspendingGroupContent } from "../../ui/suspending-group-content";
import { ListRow } from "./list-row";
import { ListSkeleton } from "./list-skeleton";

export interface ListViewProps<TData> {
  /**
   * Additional className
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
}

/**
 * ListView with property-based display
 * Auto-generates list item display from properties
 */
export function ListView<
  TData,
  TProperties extends
    readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
>({ className, onItemClick, pagination }: ListViewProps<TData>) {
  // Get data and properties from context
  const {
    data,
    properties,
    propertyVisibility,
    pagination: contextPagination,
    counts,
    group,
    groupKeys,
    expandedGroups,
    onExpandedGroupsChange,
  } = useDataViewContext<TData, TProperties>();

  // Use shared view setup hook
  const {
    groupConfig,
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
    propertyVisibility,
    groupConfig ? [groupConfig.groupBy] : undefined
  );

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
      <div className={cn("flex flex-col gap-4", className)}>
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
                      <ListSkeleton rowCount={5} withPagination={false} />
                    }
                  >
                    <SuspendingGroupListContent<TData, TProperties>
                      displayProperties={displayProperties}
                      groupItem={groupItem}
                      onItemClick={onItemClick}
                      pagination={pagination}
                      properties={properties}
                    />
                  </Suspense>
                ) : null}
              </GroupSection>
            );
          })}
        </Accordion>
      </div>
    );
  }

  // FLAT VIEW: Uses SuspendingGroupContent with __ungrouped__ key
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Suspense
        fallback={
          <ListSkeleton rowCount={10} withPagination={Boolean(pagination)} />
        }
      >
        <SuspendingGroupListContent<TData, TProperties>
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
      </Suspense>
    </div>
  );
}

// ============================================================================
// Suspending Group Content Component
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
 * Internal component that fetches data for a group using Suspense.
 * Renders inside GroupSection's AccordionContent.
 */
function SuspendingGroupListContent<
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
        // Transform data with property definitions
        const transformedItems = transformData(
          result.data,
          properties
        ) as TData[];

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
          <>
            <ListRow
              allProperties={properties}
              data={transformedItems}
              displayProperties={displayProperties}
              onItemClick={onItemClick}
            />
            {renderPagination(pagination, paginationContext)}
          </>
        );
      }}
    </SuspendingGroupContent>
  );
}

// Re-export from shared with view-specific aliases
export type { DataViewContextValue as ListContextValue } from "../../../lib/providers/data-view-context";
// biome-ignore lint/performance/noBarrelFile: Re-exporting shared components with view-specific names
export { useDataViewContext as useListContext } from "../../../lib/providers/data-view-context";
export type { DataViewProviderProps as ListProviderProps } from "../../../lib/providers/data-view-provider";
export { DataViewProvider as ListProvider } from "../../../lib/providers/data-view-provider";
export {
  Visibility,
  type VisibilityProps,
} from "../../ui/toolbar/visibility";
// Skeleton
export { ListSkeleton } from "./list-skeleton";
