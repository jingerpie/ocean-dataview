"use client";

import { AlertCircle } from "lucide-react";
import { Suspense } from "react";
import type { GroupedDataItem } from "../../../hooks";
import { useDisplayProperties, useViewSetup } from "../../../hooks";
import type { UseGroupQueryResult } from "../../../hooks/use-group-query";
import { useDataViewContext } from "../../../lib/providers/data-view-context";
import { cn, transformData } from "../../../lib/utils";
import { getGalleryCardDimensions } from "../../../lib/utils/get-card-sizes";
import type { DataViewProperty, PaginationContext } from "../../../types";
import { Accordion } from "../../ui/accordion";
import { GroupSection } from "../../ui/group-section";
import { type PaginationMode, renderPagination } from "../../ui/paginations";
import { SuspendingGroupContent } from "../../ui/suspending-group-content";
import { DataCard } from "../data-card";
import { GallerySkeleton } from "./gallery-skeleton";

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
    limit,
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
  // Note: We no longer exclude cardPreview or groupBy here - they should be toggleable in Visibility
  const displayProperties = useDisplayProperties(
    properties,
    propertyVisibility
  );

  const { imageHeight, cols } = getGalleryCardDimensions(cardSize);

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
                      <GallerySkeleton
                        cardCount={limit ?? 6}
                        cardSize={cardSize}
                        propertyTypes={displayProperties.map((p) => p.type)}
                        withImage={Boolean(cardPreview)}
                      />
                    }
                  >
                    <SuspendingGroupGalleryContent<TData, TProperties>
                      cardPreview={cardPreview}
                      cols={cols}
                      displayProperties={displayProperties}
                      fitMedia={fitMedia}
                      groupItem={groupItem}
                      imageHeight={imageHeight}
                      onCardClick={onCardClick}
                      pagination={pagination}
                      properties={properties}
                      showPropertyNames={showPropertyNames}
                      wrapAllProperties={wrapAllProperties}
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
          <GallerySkeleton
            cardCount={limit ?? 10}
            cardSize={cardSize}
            pagination={pagination}
            propertyTypes={displayProperties.map((p) => p.type)}
            withImage={Boolean(cardPreview)}
          />
        }
      >
        <SuspendingGroupGalleryContent<TData, TProperties>
          cardPreview={cardPreview}
          cols={cols}
          displayProperties={displayProperties}
          fitMedia={fitMedia}
          groupItem={{
            key: "__ungrouped__",
            items: [],
            count: 0,
            displayCount: "0",
            sortValue: "",
          }}
          imageHeight={imageHeight}
          onCardClick={onCardClick}
          pagination={pagination}
          properties={properties}
          showPropertyNames={showPropertyNames}
          wrapAllProperties={wrapAllProperties}
        />
      </Suspense>
    </div>
  );
}

// Static marker for view type detection in DataViewProvider
GalleryView.dataViewType = "gallery" as const;

// ============================================================================
// Suspending Group Content Component
// ============================================================================

interface SuspendingGroupGalleryContentProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  cardPreview?: string;
  cols: string;
  displayProperties: TProperties[number][];
  fitMedia: boolean;
  groupItem: GroupedDataItem<TData>;
  imageHeight: number;
  onCardClick?: (item: TData) => void;
  pagination?: PaginationMode;
  properties: TProperties;
  showPropertyNames: boolean;
  wrapAllProperties: boolean;
}

/**
 * Internal component that fetches data for a group using Suspense.
 * Renders inside GroupSection's AccordionContent.
 */
function SuspendingGroupGalleryContent<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  cardPreview,
  cols,
  displayProperties,
  fitMedia,
  groupItem,
  imageHeight,
  onCardClick,
  pagination,
  properties,
  showPropertyNames,
  wrapAllProperties,
}: SuspendingGroupGalleryContentProps<TData, TProperties>) {
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
            <div className={cn("grid gap-4", cols)}>
              {transformedItems.map((item, index) => {
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
            {renderPagination(pagination, paginationContext)}
          </>
        );
      }}
    </SuspendingGroupContent>
  );
}
