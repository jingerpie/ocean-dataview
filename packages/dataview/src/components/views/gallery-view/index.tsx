"use client";

import { AlertCircle } from "lucide-react";
import type { GroupedDataItem } from "../../../hooks";
import { useDisplayProperties, useViewSetup } from "../../../hooks";
import { useDataViewContext } from "../../../lib/providers/data-view-context";
import { buildPaginationContext, cn } from "../../../lib/utils";
import { getGalleryCardDimensions } from "../../../lib/utils/get-card-sizes";
import type { DataViewProperty } from "../../../types";
import { Accordion } from "../../ui/accordion";
import { GroupSection } from "../../ui/group-section";
import { type PaginationMode, renderPagination } from "../../ui/paginations";
import { DataCard } from "../data-card";

export interface GalleryViewProps<
  TData,
  TProperties extends
    readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
> {
  /**
   * Layout configuration
   */
  layout: {
    /** Property ID for card preview image (references property.id, not data key) */
    cardPreview?: TProperties[number]["id"];
    cardSize?: "small" | "medium" | "large";
    fitMedia?: boolean;
    wrapAllProperties?: boolean;
    showPropertyNames?: boolean;
  };

  /**
   * View configuration
   */
  view?: {
    propertyVisibility?: TProperties[number]["id"][];

    /**
     * Group By configuration - creates collapsible groups in gallery
     */
    group?: {
      /** Property ID to group by (references property.id, not data key) */
      groupBy: TProperties[number]["id"];
      /**
       * How to group the data:
       * - For date properties: 'day' | 'week' | 'month' | 'year' | 'relative' (default: 'relative')
       * - For status properties: 'option' (group by status value) | 'group' (group by status group like todo/inProgress/complete) (default: 'option')
       * - For select/multi-select: 'option' (group by option value) (default behavior)
       */
      showAs?:
        | "day"
        | "week"
        | "month"
        | "year"
        | "relative"
        | "group"
        | "option";
      /** Week start day (only for showAs: 'week') */
      startWeekOn?: "monday" | "sunday";
      /** Sort groups by property value (default: 'propertyAscending') */
      sort?: "propertyAscending" | "propertyDescending";
      /** Hide groups with no items (default: true) */
      hideEmptyGroups?: boolean;
      /** Display aggregation counts in group headers (default: true) */
      showAggregation?: boolean;
      /** Controlled expansion state (array of expanded group keys) */
      expandedGroups?: string[];
      /** Callback when expansion state changes */
      onExpandedChange?: (groups: string[]) => void;
    };
  };

  /**
   * Card click handler
   */
  onCardClick?: (item: TData) => void;

  /**
   * Pagination mode for the gallery.
   * - "page": Classic prev/next pagination with "Showing X-Y"
   * - "loadMore": "Load more" button
   * - "infiniteScroll": Auto-load on scroll
   * - undefined: No pagination UI
   *
   * For grouped galleries: renders inside each group
   * For flat galleries: renders below the gallery
   */
  pagination?: PaginationMode;

  /**
   * Additional className
   */
  className?: string;
}

/**
 * GalleryView with property-based display
 * Displays data as cards in a responsive grid with images
 */
export function GalleryView<
  TData,
  TProperties extends
    readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
>({
  layout = {},
  view = {},
  onCardClick,
  pagination,
  className,
}: GalleryViewProps<TData, TProperties>) {
  // Get data and properties from context
  const {
    data,
    properties,
    propertyVisibility,
    pagination: contextPagination,
    setExcludedPropertyIds,
    setPropertyVisibility,
  } = useDataViewContext<TData, TProperties>();

  const {
    cardPreview,
    cardSize = "medium",
    fitMedia = true,
    wrapAllProperties = false,
    showPropertyNames = false,
  } = layout;
  const { propertyVisibility: viewPropertyVisibility, group: groupBy } = view;

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
    groupBy: groupBy
      ? {
          groupBy: String(groupBy.groupBy),
          showAs: groupBy.showAs,
          startWeekOn: groupBy.startWeekOn,
          sort: groupBy.sort,
          hideEmptyGroups: groupBy.hideEmptyGroups,
        }
      : undefined,
    viewPropertyVisibility,
    contextPagination,
    setExcludedPropertyIds,
    setPropertyVisibility,
  });

  // Use shared hook for display properties filtering (exclude preview and groupBy)
  const excludeKeys = [
    cardPreview,
    ...(groupConfig ? [groupConfig.groupBy] : []),
  ].filter((key): key is string => key !== undefined);
  const displayProperties = useDisplayProperties(
    properties,
    propertyVisibility,
    excludeKeys
  );

  const { imageHeight, cols } = getGalleryCardDimensions(cardSize);

  // Transform flat data for non-grouped view (must be before early returns)
  const transformedFlatData = transformedData;

  // Helper to render card grid
  const renderCardGrid = (items: TData[]) => (
    <div className={cn("grid gap-4", cols)}>
      {items.map((item, index) => {
        const firstProperty = displayProperties[0];
        const uniqueKey = firstProperty
          ? `card-${String((item as Record<string, unknown>)[firstProperty.id])}-${index}`
          : `card-${index}`;

        return (
          <DataCard
            allProperties={properties}
            cardPreview={cardPreview}
            displayProperties={displayProperties}
            fitMedia={fitMedia}
            imageHeight={imageHeight}
            item={item}
            key={uniqueKey}
            onCardClick={onCardClick}
            showPropertyNames={showPropertyNames}
            wrapAllProperties={wrapAllProperties}
          />
        );
      })}
    </div>
  );

  // Error state
  if (validationError || propertyValidationError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/5 p-8">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <p className="font-medium text-destructive">
          Invalid gallery configuration
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
  if (groupBy && groupedData) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <Accordion
          multiple
          onValueChange={groupBy.onExpandedChange}
          value={groupBy.expandedGroups ?? []}
        >
          {groupedData.map((group: GroupedDataItem<TData>) => {
            // Build pagination context for this group using shared utility
            const paginationContext = buildPaginationContext(
              contextPagination,
              group.key
            );

            return (
              <GroupSection
                group={group}
                groupByPropertyDef={groupByProperty}
                isLoading={false}
                key={group.key}
                renderFooter={renderPagination(pagination, paginationContext)}
                showAggregation={groupBy?.showAggregation ?? true}
                stickyHeader={{ enabled: true, offset: 56 }}
              >
                {renderCardGrid(group.items)}
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
    "$all"
  );

  // STANDARD VIEW: Flat gallery without grouping
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {renderCardGrid(transformedFlatData)}
      {renderPagination(pagination, flatPaginationContext)}
    </div>
  );
}

// Re-export from shared with view-specific aliases
export type { DataViewContextValue as GalleryContextValue } from "../../../lib/providers/data-view-context";
// biome-ignore lint/performance/noBarrelFile: Re-exporting shared components with view-specific names
export { useDataViewContext as useGalleryContext } from "../../../lib/providers/data-view-context";
export type { DataViewProviderProps as GalleryProviderProps } from "../../../lib/providers/data-view-provider";
export { DataViewProvider as GalleryProvider } from "../../../lib/providers/data-view-provider";
export {
  Visibility,
  type VisibilityProps,
} from "../../ui/toolbar/visibility";
// Skeleton
export { GallerySkeleton } from "./gallery-skeleton";
