"use client";

import { AlertCircle } from "lucide-react";
import type { GroupedDataItem } from "../../../hooks";
import { useDisplayProperties, useViewSetup } from "../../../hooks";
import { useDataViewContext } from "../../../lib/providers/data-view-context";
import { buildPaginationContext, cn } from "../../../lib/utils";
import type { DataViewProperty } from "../../../types";
import { Accordion } from "../../ui/accordion";
import { GroupSection } from "../../ui/group-section";
import { type PaginationMode, renderPagination } from "../../ui/paginations";
import { ListRow } from "./list-row";

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
>({ onItemClick, pagination, className }: ListViewProps<TData>) {
  // Get data and properties from context
  const {
    data,
    properties,
    propertyVisibility,
    pagination: contextPagination,
    counts,
    group,
    expandedGroups,
    onExpandedGroupsChange,
  } = useDataViewContext<TData, TProperties>();

  // Use shared view setup hook
  const {
    transformedData,
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

  // Transform flat data for non-grouped view (must be before early returns)
  const transformedFlatData = transformedData;

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

  // GROUPED VIEW: Render using Accordion for collapsible groups
  // Note: Check grouped view before empty state, because with lazy loading
  // data might be empty but we still want to show group headers with counts
  if (group && groupedData) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <Accordion
          multiple
          onValueChange={onExpandedGroupsChange}
          value={expandedGroups ?? []}
        >
          {groupedData.map((groupItem: GroupedDataItem<TData>) => {
            // Build pagination context for this group using shared utility
            const paginationContext = buildPaginationContext(
              contextPagination,
              groupItem.key
            );

            return (
              <GroupSection
                group={groupItem}
                groupByPropertyDef={groupByProperty}
                isLoading={false}
                key={groupItem.key}
                renderFooter={renderPagination(pagination, paginationContext)}
                showAggregation={group.showCount ?? true}
                stickyHeader={{ enabled: true, offset: 57 }}
              >
                <ListRow
                  allProperties={properties}
                  data={groupItem.items}
                  displayProperties={displayProperties}
                  onItemClick={onItemClick}
                />
              </GroupSection>
            );
          })}
        </Accordion>
      </div>
    );
  }

  // Empty state for non-grouped view
  if (Array.isArray(data) && data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
        <p>No data to display</p>
      </div>
    );
  }

  // Build pagination context for flat view
  const flatPaginationContext = buildPaginationContext(
    contextPagination,
    "__ungrouped__"
  );

  // STANDARD VIEW: Flat list without grouping
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <ListRow
        allProperties={properties}
        data={transformedFlatData}
        displayProperties={displayProperties}
        onItemClick={onItemClick}
      />
      {renderPagination(pagination, flatPaginationContext)}
    </div>
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
