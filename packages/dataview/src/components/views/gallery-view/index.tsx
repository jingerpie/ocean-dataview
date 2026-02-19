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

export interface GalleryViewProps<TData> {
  /**
   * Property ID for card preview image (references property.id, not data key)
   */
  cardPreview?: string;

  /**
   * Card size preset
   * @default "medium"
   */
  cardSize?: "small" | "medium" | "large";

  /**
   * Additional className
   */
  className?: string;

  /**
   * Whether to fit media to card (object-cover vs object-contain)
   * @default true
   */
  fitMedia?: boolean;

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
   * Show property names on cards
   * @default false
   */
  showPropertyNames?: boolean;

  /**
   * Wrap all properties text
   * @default false
   */
  wrapAllProperties?: boolean;
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
  cardPreview,
  cardSize = "medium",
  className,
  fitMedia = true,
  onCardClick,
  pagination,
  showPropertyNames = false,
  wrapAllProperties = false,
}: GalleryViewProps<TData>) {
  // Get data and properties from context
  const {
    data,
    properties,
    propertyVisibility,
    pagination: contextPagination,
    counts,
    group,
  } = useDataViewContext<TData, TProperties>();

  // Use shared view setup hook
  const {
    transformedData,
    groupedData,
    groupByProperty,
    validationError,
    propertyValidationError,
  } = useViewSetup({
    data: data as TData[],
    properties,
    group,
    contextPagination,
    counts: counts?.group,
  });

  // Use shared hook for display properties filtering
  // Note: We no longer exclude cardPreview or groupBy here - they should be toggleable in Visibility
  const displayProperties = useDisplayProperties(
    properties,
    propertyVisibility
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
  if (group && groupedData) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <Accordion
          multiple
          onValueChange={group.onExpandedChange}
          value={group.expanded ?? []}
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
                {renderCardGrid(groupItem.items)}
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
