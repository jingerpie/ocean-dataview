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
import {
  Pagination,
  type PaginationMode,
} from "@/registry/base-nova/components/dataview/pagination/pagination";
import { GroupSection } from "@/registry/base-nova/components/dataview/shared/group-section";
import {
  SuspendingGroupContent,
  SuspendingInfiniteGroupContent,
} from "@/registry/base-nova/components/dataview/shared/suspending-group-content";
import { GallerySkeleton } from "@/registry/base-nova/components/dataview/skeletons/gallery-skeleton";
import { DataCard } from "@/registry/base-nova/components/dataview/views/data-card";
import { InfiniteScrollGroupsSentinel } from "@/registry/base-nova/components/dataview/views/infinite-scroll-groups-sentinel";
import { getGalleryCardDimensions } from "@/registry/base-nova/lib/dataview/get-card-sizes";
import { Accordion } from "@/registry/base-nova/ui/dataview-accordion";

export interface GalleryViewProps<TData> {
  /**
   * Card layout mode
   * - "list": Properties stack vertically, one per line
   * - "compact": Properties flow in a wrapping row
   * @default "list"
   */
  cardLayout?: "list" | "compact";

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
   * Additional className for the gallery wrapper
   */
  className?: string;

  /**
   * Whether to fit media to card (object-cover vs object-contain)
   * @default false
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
   * Sticky header configuration for grouped mode.
   * @default { enabled: false }
   */
  stickyHeader?: { enabled: boolean; offset?: number };

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
  cardLayout = "list",
  className,
  cardPreview,
  cardSize = "medium",
  fitMedia = false,
  onCardClick,
  pagination,
  showPropertyNames = false,
  stickyHeader: stickyHeaderProp,
  wrapAllProperties = false,
}: GalleryViewProps<TData>) {
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
  // Note: We no longer exclude cardPreview or groupBy here - they should be toggleable in Visibility
  const displayProperties = useDisplayProperties(
    properties,
    propertyVisibility
  );

  const { imageHeight, minWidth } = getGalleryCardDimensions(cardSize);

  // Determine if we're using infinite pagination for data
  const useInfinitePagination =
    pagination === "loadMore" || pagination === "infiniteScroll";

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
                      <GallerySkeleton
                        cardCount={limit ?? DEFAULT_LIMIT}
                        cardLayout={cardLayout}
                        cardSize={cardSize}
                        properties={displayProperties}
                        withImage={Boolean(cardPreview)}
                      />
                    }
                  >
                    {useInfinitePagination ? (
                      <SuspendingInfiniteGalleryContent<TData, TProperties>
                        cardLayout={cardLayout}
                        cardPreview={cardPreview}
                        className={className}
                        displayProperties={displayProperties}
                        fitMedia={fitMedia}
                        groupItem={groupItem}
                        imageHeight={imageHeight}
                        minWidth={minWidth}
                        onCardClick={onCardClick}
                        pagination={pagination}
                        properties={properties}
                        showPropertyNames={showPropertyNames}
                        wrapAllProperties={wrapAllProperties}
                      />
                    ) : (
                      <SuspendingPageGalleryContent<TData, TProperties>
                        cardLayout={cardLayout}
                        cardPreview={cardPreview}
                        className={className}
                        displayProperties={displayProperties}
                        fitMedia={fitMedia}
                        groupItem={groupItem}
                        imageHeight={imageHeight}
                        minWidth={minWidth}
                        onCardClick={onCardClick}
                        pagination={pagination}
                        properties={properties}
                        showPropertyNames={showPropertyNames}
                        wrapAllProperties={wrapAllProperties}
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
    <SuspendingInfiniteGalleryContent<TData, TProperties>
      cardLayout={cardLayout}
      cardPreview={cardPreview}
      className={className}
      displayProperties={displayProperties}
      fitMedia={fitMedia}
      groupItem={{
        key: UNGROUPED_KEY,
        items: [],
        count: 0,
        displayCount: "0",
        sortValue: "",
      }}
      imageHeight={imageHeight}
      minWidth={minWidth}
      onCardClick={onCardClick}
      pagination={pagination}
      properties={properties}
      showPropertyNames={showPropertyNames}
      wrapAllProperties={wrapAllProperties}
    />
  ) : (
    <SuspendingPageGalleryContent<TData, TProperties>
      cardLayout={cardLayout}
      cardPreview={cardPreview}
      className={className}
      displayProperties={displayProperties}
      fitMedia={fitMedia}
      groupItem={{
        key: UNGROUPED_KEY,
        items: [],
        count: 0,
        displayCount: "0",
        sortValue: "",
      }}
      imageHeight={imageHeight}
      minWidth={minWidth}
      onCardClick={onCardClick}
      pagination={pagination}
      properties={properties}
      showPropertyNames={showPropertyNames}
      wrapAllProperties={wrapAllProperties}
    />
  );
}

// Static marker for view type detection in DataViewProvider

// ============================================================================
// Suspending Group Content Components
// ============================================================================

interface SuspendingGroupGalleryContentProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  cardLayout: "list" | "compact";
  cardPreview?: string;
  className?: string;
  displayProperties: TProperties[number][];
  fitMedia: boolean;
  groupItem: GroupedDataItem<TData>;
  imageHeight: number;
  minWidth: number;
  onCardClick?: (item: TData) => void;
  pagination?: PaginationMode;
  properties: TProperties;
  showPropertyNames: boolean;
  wrapAllProperties: boolean;
}

/**
 * Gallery content renderer - used by both page and infinite pagination variants.
 */
function GalleryContentRenderer<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  cardLayout,
  cardPreview,
  className,
  data,
  displayProperties,
  fitMedia,
  imageHeight,
  minWidth,
  onCardClick,
  paginationNode,
  properties,
  showPropertyNames,
  wrapAllProperties,
}: {
  cardLayout: "list" | "compact";
  cardPreview?: string;
  className?: string;
  data: TData[];
  displayProperties: TProperties[number][];
  fitMedia: boolean;
  imageHeight: number;
  minWidth: number;
  onCardClick?: (item: TData) => void;
  paginationNode: React.ReactNode;
  properties: TProperties;
  showPropertyNames: boolean;
  wrapAllProperties: boolean;
}) {
  // Transform data with property schema
  const transformedItems = transformData(data, properties) as TData[];

  return (
    <div className={className}>
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
        }}
      >
        {transformedItems.map((item, index) => {
          const firstProperty = displayProperties[0];
          const uniqueKey = firstProperty
            ? `card-${String((item as Record<string, unknown>)[firstProperty.id])}-${index}`
            : `card-${index}`;

          return (
            <DataCard
              allProperties={properties}
              cardLayout={cardLayout}
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
      {paginationNode}
    </div>
  );
}

/**
 * Page pagination variant - uses useGroupQuery for prev/next navigation.
 */
function SuspendingPageGalleryContent<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  cardLayout,
  cardPreview,
  className,
  displayProperties,
  fitMedia,
  groupItem,
  imageHeight,
  minWidth,
  onCardClick,
  pagination,
  properties,
  showPropertyNames,
  wrapAllProperties,
}: SuspendingGroupGalleryContentProps<TData, TProperties>) {
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
          <GalleryContentRenderer
            cardLayout={cardLayout}
            cardPreview={cardPreview}
            className={className}
            data={result.data}
            displayProperties={displayProperties}
            fitMedia={fitMedia}
            imageHeight={imageHeight}
            minWidth={minWidth}
            onCardClick={onCardClick}
            paginationNode={
              <Pagination context={paginationContext} mode={pagination} />
            }
            properties={properties}
            showPropertyNames={showPropertyNames}
            wrapAllProperties={wrapAllProperties}
          />
        );
      }}
    </SuspendingGroupContent>
  );
}

/**
 * Infinite pagination variant - uses useInfiniteGroupQuery for load more / infinite scroll.
 */
function SuspendingInfiniteGalleryContent<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  cardLayout,
  cardPreview,
  className,
  displayProperties,
  fitMedia,
  groupItem,
  imageHeight,
  minWidth,
  onCardClick,
  pagination,
  properties,
  showPropertyNames,
  wrapAllProperties,
}: SuspendingGroupGalleryContentProps<TData, TProperties>) {
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
          <GalleryContentRenderer
            cardLayout={cardLayout}
            cardPreview={cardPreview}
            className={className}
            data={result.data}
            displayProperties={displayProperties}
            fitMedia={fitMedia}
            imageHeight={imageHeight}
            minWidth={minWidth}
            onCardClick={onCardClick}
            paginationNode={
              <Pagination context={paginationContext} mode={pagination} />
            }
            properties={properties}
            showPropertyNames={showPropertyNames}
            wrapAllProperties={wrapAllProperties}
          />
        );
      }}
    </SuspendingInfiniteGroupContent>
  );
}
