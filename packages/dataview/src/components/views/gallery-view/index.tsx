"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { Suspense, useCallback, useEffect, useRef } from "react";
import type { GroupedDataItem } from "../../../hooks";
import { useDisplayProperties, useViewSetup } from "../../../hooks";
import type { UseGroupQueryResult } from "../../../hooks/use-group-query";
import type { UseInfiniteGroupQueryResult } from "../../../hooks/use-infinite-group-query";
import { useDataViewContext } from "../../../lib/providers/data-view-context";
import { cn, transformData } from "../../../lib/utils";
import { getGalleryCardDimensions } from "../../../lib/utils/get-card-sizes";
import type { DataViewProperty, PaginationContext } from "../../../types";
import { Accordion } from "../../ui/accordion";
import { GroupSection } from "../../ui/group-section";
import { Pagination, type PaginationMode } from "../../ui/pagination";
import {
  SuspendingGroupContent,
  SuspendingInfiniteGroupContent,
} from "../../ui/suspending-group-content";
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

  const { imageHeight, cols } = getGalleryCardDimensions(cardSize);

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
                stickyHeader={{ enabled: true, offset: 57 }}
              >
                {isExpanded ? (
                  <Suspense
                    fallback={
                      <GallerySkeleton
                        cardCount={limit ?? GalleryView.defaultLimit}
                        cardSize={cardSize}
                        propertyTypes={displayProperties.map((p) => p.type)}
                        withImage={Boolean(cardPreview)}
                      />
                    }
                  >
                    {useInfinitePagination ? (
                      <SuspendingInfiniteGalleryContent<TData, TProperties>
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
                    ) : (
                      <SuspendingPageGalleryContent<TData, TProperties>
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
        <GallerySkeleton
          cardCount={limit ?? GalleryView.defaultLimit}
          cardSize={cardSize}
          pagination={pagination}
          propertyTypes={displayProperties.map((p) => p.type)}
          withImage={Boolean(cardPreview)}
        />
      }
    >
      {useInfinitePagination ? (
        <SuspendingInfiniteGalleryContent<TData, TProperties>
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
      ) : (
        <SuspendingPageGalleryContent<TData, TProperties>
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
      )}
    </Suspense>
  );
}

// Static marker for view type detection in DataViewProvider
GalleryView.dataViewType = "gallery" as const;
GalleryView.defaultLimit = 50;

// ============================================================================
// Suspending Group Content Components
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
 * Gallery content renderer - used by both page and infinite pagination variants.
 */
function GalleryContentRenderer<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  cardPreview,
  cols,
  data,
  displayProperties,
  fitMedia,
  imageHeight,
  onCardClick,
  paginationNode,
  properties,
  showPropertyNames,
  wrapAllProperties,
}: {
  cardPreview?: string;
  cols: string;
  data: TData[];
  displayProperties: TProperties[number][];
  fitMedia: boolean;
  imageHeight: number;
  onCardClick?: (item: TData) => void;
  paginationNode: React.ReactNode;
  properties: TProperties;
  showPropertyNames: boolean;
  wrapAllProperties: boolean;
}) {
  // Transform data with property schema
  const transformedItems = transformData(data, properties) as TData[];

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
      {paginationNode}
    </>
  );
}

/**
 * Page pagination variant - uses useGroupQuery for prev/next navigation.
 */
function SuspendingPageGalleryContent<
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
            cardPreview={cardPreview}
            cols={cols}
            data={result.data}
            displayProperties={displayProperties}
            fitMedia={fitMedia}
            imageHeight={imageHeight}
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
            cardPreview={cardPreview}
            cols={cols}
            data={result.data}
            displayProperties={displayProperties}
            fitMedia={fitMedia}
            imageHeight={imageHeight}
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
