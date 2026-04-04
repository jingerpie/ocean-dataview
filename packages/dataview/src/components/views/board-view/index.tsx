"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDisplayProperties } from "../../../hooks/use-display-properties";
import type { GroupedDataItem } from "../../../hooks/use-group-config";
import { useGroupParams } from "../../../hooks/use-group-params";
import type { UseInfiniteGroupQueryResult } from "../../../hooks/use-infinite-group-query";
import { useScrollSync } from "../../../hooks/use-scroll-sync";
import { useDataViewContext } from "../../../lib/providers/data-view-context";
import type { GroupByConfig } from "../../../types/group.type";
import type { PaginationContext } from "../../../types/pagination";
import type {
  GroupCountInfo,
  GroupCounts,
} from "../../../types/pagination-types";
import type {
  BadgeColor,
  DataViewProperty,
} from "../../../types/property.type";
import { getBadgeBgTransparentClass } from "../../../utils/badge-colors";
import { groupByProperty as groupDataByProperty } from "../../../utils/compute-data";
import { getBoardCardDimensions } from "../../../utils/get-card-sizes";
import { transformData } from "../../../utils/transform-data";
import { validatePropertyKeys } from "../../../validators/valid-properties";
import { Accordion } from "../../ui/accordion";
import { Badge } from "../../ui/badge";
import { GroupSection } from "../../ui/group-section";
import { Pagination } from "../../ui/pagination";
import { SuspendingInfiniteGroupContent } from "../../ui/suspending-group-content";
import { DataCard } from "../data-card";
import { DataCell } from "../data-cell";
import { EmptyState } from "../empty-state";
import { BoardColumnHeaders, parseColumnWidth } from "./board-column-headers";
import { BoardColumns } from "./board-columns";
import { BoardSkeleton } from "./board-skeleton";
import { StickyColumnLabel } from "./sticky-column-label";

/**
 * Pagination mode for board views.
 * Board views only support infinite pagination modes (not page-based prev/next).
 * - "loadMore": "Load more" button that appends items
 * - "infiniteScroll": Automatic loading when scrolling near bottom
 * - undefined: No pagination UI
 */
export type BoardPaginationMode = "loadMore" | "infiniteScroll";

export interface BoardViewProps<TData> {
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
   * Color column backgrounds based on property option colors
   * @default false
   */
  colorColumns?: boolean;

  /**
   * Group counts from server (for rendering column headers with server-side counts)
   * Only needed when using server-side pagination.
   */
  counts?: GroupCounts;

  /**
   * Whether to fit media to card (object-cover vs object-contain)
   * @default true
   */
  fitMedia?: boolean;

  /**
   * Function to extract unique key from item
   */
  keyExtractor?: (item: TData, index: number) => string;

  /**
   * Card click handler
   */
  onCardClick?: (item: TData) => void;

  /**
   * Pagination mode for the board.
   * - "loadMore": "Load more" button that appends items
   * - "infiniteScroll": Auto-load on scroll
   * - undefined: No pagination UI
   *
   * Note: Board views only support infinite pagination modes.
   * Page-based (prev/next) pagination is not supported for boards.
   */
  pagination?: BoardPaginationMode;

  /**
   * Show property names on cards
   * @default false
   */
  showPropertyNames?: boolean;

  /**
   * Sticky header configuration.
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
 * BoardView with property-based display
 * Displays data as Kanban board with grouped columns
 */
export function BoardView<
  TData,
  TProperties extends
    readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
>({
  cardLayout = "list",
  cardPreview,
  cardSize = "medium",
  colorColumns = false,
  counts: _counts,
  fitMedia = true,
  keyExtractor = (item: TData, index: number) =>
    String((item as { id?: string }).id || index),
  onCardClick,
  pagination,
  showPropertyNames = false,
  stickyHeader: stickyHeaderProp,
  wrapAllProperties = false,
}: BoardViewProps<TData>) {
  const stickyEnabled = stickyHeaderProp?.enabled ?? false;
  const stickyOffset = stickyHeaderProp?.offset ?? 0;
  // Get data and properties from context
  // Board terminology: column = board columns, group = accordion rows
  const {
    properties,
    counts: contextCounts,
    columnCounts: contextColumnCounts,
    propertyVisibility,
    column: columnConfig,
    group: groupConfig,
    groupKeys,
    expandedGroups,
    onExpandedGroupsChange,
    hasNextGroupPage,
    isFetchingNextGroupPage,
    onLoadMoreGroups,
    limit,
  } = useDataViewContext<TData, TProperties>();

  // Get sort order from URL params (managed by useGroupParams)
  const { groupSortOrder } = useGroupParams();

  // Use prop counts if provided, otherwise fall back to context
  // columnCounts for board columns, contextCounts?.group for accordion rows
  const columnCounts = _counts ?? contextColumnCounts;
  const columnSortValues = contextCounts?.groupSortValues;
  const groupCounts = contextCounts?.group;

  // Validate property keys
  const propertyValidationError = useMemo(
    () => validatePropertyKeys(properties),
    [properties]
  );

  // Get column property for header display
  const columnProperty = useMemo(() => {
    if (columnConfig?.propertyId) {
      return properties.find((p) => String(p.id) === columnConfig.propertyId);
    }
    return undefined;
  }, [columnConfig, properties]);

  // Get row group property for accordion headers
  const rowGroupPropertyDef = useMemo(() => {
    if (groupConfig?.propertyId) {
      return properties.find((p) => String(p.id) === groupConfig.propertyId);
    }
    return undefined;
  }, [groupConfig, properties]);

  // Build column structure from counts (for headers)
  const columns: GroupedDataItem<TData>[] = useMemo(() => {
    if (!columnCounts) {
      return [];
    }

    return Object.entries(columnCounts)
      .map(([key, countInfo]: [string, GroupCountInfo]) => ({
        key,
        items: [] as TData[], // Items loaded via Suspense
        count: countInfo.count,
        displayCount: countInfo.hasMore ? "99+" : String(countInfo.count),
        sortValue: columnSortValues?.[key] ?? key,
      }))
      .sort((a, b) => {
        const aVal = a.sortValue;
        const bVal = b.sortValue;
        let result: number;
        if (typeof aVal === "number" && typeof bVal === "number") {
          result = aVal - bVal;
        } else {
          result = String(aVal).localeCompare(String(bVal));
        }
        return groupSortOrder === "desc" ? -result : result;
      });
  }, [columnCounts, columnSortValues, groupSortOrder]);

  // Build row groups from counts (for accordion)
  const rowGroups: GroupedDataItem<TData>[] = useMemo(() => {
    if (!groupCounts) {
      return [];
    }

    const rowGroupSortValues = contextCounts?.groupSortValues;
    const sortOrder = groupConfig?.sort ?? "asc";

    return Object.entries(groupCounts)
      .map(([key, countInfo]: [string, GroupCountInfo]) => ({
        key,
        items: [] as TData[],
        count: countInfo.count,
        displayCount: countInfo.hasMore ? "99+" : String(countInfo.count),
        sortValue: rowGroupSortValues?.[key] ?? key,
      }))
      .filter((g) => {
        if (groupConfig?.hideEmpty ?? false) {
          return g.count > 0;
        }
        return true;
      })
      .sort((a, b) => {
        const aVal = a.sortValue;
        const bVal = b.sortValue;
        let result: number;
        if (typeof aVal === "number" && typeof bVal === "number") {
          result = aVal - bVal;
        } else {
          result = String(aVal).localeCompare(String(bVal));
        }
        return sortOrder === "desc" ? -result : result;
      });
  }, [
    groupCounts,
    contextCounts?.groupSortValues,
    groupConfig?.sort,
    groupConfig?.hideEmpty,
  ]);

  // Get column options from property config
  const columnOptions = useMemo(() => {
    if (!columnProperty) {
      return [];
    }

    if (columnProperty.type === "select") {
      return columnProperty.config?.options || [];
    }

    if (columnProperty.type === "status") {
      const groups = columnProperty.config?.groups || [];
      return groups.flatMap((group) =>
        group.options.map((value) => ({ value, color: group.color }))
      );
    }

    if (columnProperty.type === "multiSelect") {
      return columnProperty.config?.options || [];
    }

    return [];
  }, [columnProperty]);

  // Use shared hook for display properties filtering
  const displayProperties = useDisplayProperties(
    properties,
    propertyVisibility
  );

  // Get card dimensions based on size
  const { imageHeight, columnWidth } = getBoardCardDimensions(cardSize);

  // Get card content using shared DataCard component
  const getCardContent = (item: TData) => (
    <DataCard
      allProperties={properties}
      cardLayout={cardLayout}
      cardPreview={cardPreview}
      displayProperties={displayProperties}
      fitMedia={fitMedia}
      imageHeight={imageHeight}
      item={item}
      onCardClick={onCardClick}
      showPropertyNames={showPropertyNames}
      wrapAllProperties={wrapAllProperties}
    />
  );

  // Get column background color based on property configuration
  const getColumnBgClass = (columnName: string): string => {
    if (
      !(colorColumns && columnProperty) ||
      (columnProperty.type !== "select" &&
        columnProperty.type !== "multiSelect" &&
        columnProperty.type !== "status")
    ) {
      return "bg-transparent";
    }

    const getBgClass = (color: string) =>
      getBadgeBgTransparentClass(color as BadgeColor);

    if (
      columnConfig?.propertyType === "status" &&
      columnConfig.showAs === "group"
    ) {
      const statusGroupMap: Record<string, BadgeColor> = {
        "To Do": "gray",
        "In Progress": "blue",
        Complete: "green",
        Canceled: "red",
      };
      const color = statusGroupMap[columnName];
      if (color) {
        return getBgClass(color);
      }
    }

    const option = columnOptions.find((opt) => opt.value === columnName);

    if (!option) {
      return getBgClass("gray");
    }

    const color = (("color" in option ? option.color : undefined) ||
      "gray") as BadgeColor;
    return getBgClass(color);
  };

  // Get column header content using property-based rendering
  const getColumnHeader = (columnName: string, count: number) => {
    const showAggregation = columnConfig?.showCount ?? true;
    const displayCount = count > 99 ? "99+" : count;

    return (
      <div className="flex items-center gap-2">
        {columnProperty ? (
          <DataCell
            allProperties={properties}
            item={{} as TData}
            property={columnProperty}
            value={columnName}
          />
        ) : (
          <Badge variant="gray-subtle">{columnName}</Badge>
        )}
        {showAggregation && (
          <span className="font-medium text-muted-foreground text-xs">
            {displayCount}
          </span>
        )}
      </div>
    );
  };

  // Refs and scroll sync
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const originalHeaderRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const { register: registerScroll } = useScrollSync();
  const columnWidthPx = parseColumnWidth(columnWidth);

  // Register the header scroll container with scroll sync
  useEffect(() => {
    const el = headerScrollRef.current;
    if (!el) {
      return;
    }
    return registerScroll(el);
  }, [registerScroll]);

  // Error state
  if (propertyValidationError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/5 p-8">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <p className="font-medium text-destructive">
          Invalid board configuration
        </p>
        <p className="mt-2 text-muted-foreground text-sm">
          {propertyValidationError}
        </p>
      </div>
    );
  }

  // Determine view mode
  const hasColumns = columns.length > 0;
  const hasRowGroups = rowGroups.length > 0;
  const isGroupedBoard = Boolean(groupConfig);

  // GROUPED VIEW: Accordion rows with columns inside each
  // Sticky elements (column headers, group headers) render OUTSIDE overflow-x-auto
  // so that position: sticky works for vertical scrolling.
  // Each group's card content gets its own overflow-x-auto, synced via useScrollSync.
  if (isGroupedBoard && groupKeys && groupKeys.length > 0) {
    // Show skeleton while group counts are loading
    if (!hasRowGroups) {
      return (
        <BoardSkeleton
          cardLayout={cardLayout}
          cardSize={cardSize}
          cardsPerColumn={limit ?? BoardView.defaultLimit}
          columnCount={columns.length || 3}
          pagination={pagination}
          propertySizes={displayProperties.map((p) => p.size)}
          propertyTypes={displayProperties.map((p) => p.type)}
          withImage={Boolean(cardPreview)}
        />
      );
    }
    return (
      <div
        className="relative max-w-full overflow-clip"
        ref={boardContainerRef}
      >
        {/* Sticky column header - outside overflow-x, sticky works */}
        <StickyColumnLabel
          className={undefined}
          columnHeader={getColumnHeader}
          columnWidthPx={columnWidthPx}
          containerRef={boardContainerRef}
          enabled={stickyEnabled}
          getColumnBgClass={getColumnBgClass}
          groups={columns}
          headerRef={originalHeaderRef}
          offset={stickyOffset}
          registerScroll={registerScroll}
        />

        {/* Original column headers - hidden scrollbar, synced */}
        <div
          className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          ref={headerScrollRef}
        >
          <div className="min-w-fit">
            <BoardColumnHeaders
              columnHeader={getColumnHeader}
              columnWidth={columnWidth}
              getColumnBgClass={getColumnBgClass}
              groups={columns}
              headerRef={originalHeaderRef}
            />
          </div>
        </div>

        {/* Row group accordion sections - group headers outside overflow-x */}
        <Accordion
          multiple
          onValueChange={onExpandedGroupsChange}
          value={expandedGroups ?? []}
        >
          {rowGroups.map((rowGroup) => {
            const isExpanded = expandedGroups?.includes(rowGroup.key) ?? false;

            return (
              <GroupSection
                group={rowGroup}
                groupByPropertyDef={rowGroupPropertyDef}
                key={rowGroup.key}
                showAggregation={groupConfig?.showCount ?? true}
                stickyHeader={{
                  enabled: stickyEnabled,
                  offset: stickyOffset + 36,
                }}
              >
                {isExpanded ? (
                  <Suspense
                    fallback={
                      <BoardSkeleton
                        cardLayout={cardLayout}
                        cardSize={cardSize}
                        cardsPerColumn={limit ?? BoardView.defaultLimit}
                        columnCount={columns.length}
                        propertySizes={displayProperties.map((p) => p.size)}
                        propertyTypes={displayProperties.map((p) => p.type)}
                        withImage={Boolean(cardPreview)}
                      />
                    }
                  >
                    <SyncedScrollContainer
                      className="pb-4"
                      register={registerScroll}
                    >
                      <div className="min-w-fit">
                        <SuspendingInfiniteBoardContent<TData, TProperties>
                          columnConfig={columnConfig ?? undefined}
                          columns={columns}
                          columnWidth={columnWidth}
                          getCardContent={getCardContent}
                          getColumnBgClass={getColumnBgClass}
                          groupKey={rowGroup.key}
                          keyExtractor={keyExtractor}
                          pagination={pagination}
                          properties={properties}
                          rounded="all"
                        />
                      </div>
                    </SyncedScrollContainer>
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

        {/* Shared horizontal scrollbar */}
        <ScrollSyncBar register={registerScroll} />
      </div>
    );
  }

  // FLAT VIEW: Empty state when no columns
  if (!hasColumns) {
    return <EmptyState />;
  }

  // FLAT VIEW: StickyColumnLabel outside overflow-x, content inside
  return (
    <div className="relative max-w-full overflow-clip" ref={boardContainerRef}>
      <Suspense
        fallback={
          <BoardSkeleton
            cardLayout={cardLayout}
            cardSize={cardSize}
            cardsPerColumn={limit ?? BoardView.defaultLimit}
            columnCount={columns.length}
            pagination={pagination}
            propertySizes={displayProperties.map((p) => p.size)}
            propertyTypes={displayProperties.map((p) => p.type)}
            withImage={Boolean(cardPreview)}
          />
        }
      >
        {/* Sticky column header - outside overflow-x */}
        <StickyColumnLabel
          className={undefined}
          columnHeader={getColumnHeader}
          columnWidthPx={columnWidthPx}
          containerRef={boardContainerRef}
          enabled={stickyEnabled}
          getColumnBgClass={getColumnBgClass}
          groups={columns}
          headerRef={originalHeaderRef}
          offset={stickyOffset}
          registerScroll={registerScroll}
        />

        {/* Column headers + cards in single scroll container */}
        <div className="overflow-x-auto pb-4" ref={headerScrollRef}>
          <div className="min-w-fit">
            <BoardColumnHeaders
              columnHeader={getColumnHeader}
              columnWidth={columnWidth}
              getColumnBgClass={getColumnBgClass}
              groups={columns}
              headerRef={originalHeaderRef}
              rounded="top"
            />
            <SuspendingInfiniteBoardContent<TData, TProperties>
              columnConfig={columnConfig ?? undefined}
              columns={columns}
              columnWidth={columnWidth}
              getCardContent={getCardContent}
              getColumnBgClass={getColumnBgClass}
              groupKey="__ungrouped__"
              keyExtractor={keyExtractor}
              pagination={pagination}
              properties={properties}
              rounded="bottom"
            />
          </div>
        </div>
      </Suspense>
    </div>
  );
}

// Static marker for view type detection in DataViewProvider
BoardView.dataViewType = "board" as const;
BoardView.defaultLimit = 25;

// ============================================================================
// Suspending Group Content Components
// ============================================================================

interface SuspendingBoardContentProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  columnConfig?: GroupByConfig;
  columns: GroupedDataItem<TData>[];
  columnWidth: string;
  getCardContent: (item: TData) => React.ReactNode;
  getColumnBgClass: (columnName: string) => string;
  groupKey: string;
  keyExtractor: (item: TData, index: number) => string;
  pagination?: BoardPaginationMode;
  properties: TProperties;
  rounded?: "top" | "bottom" | "all";
}

/**
 * Board content renderer - renders cards grouped into columns.
 */
function BoardContentRenderer<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  columns,
  columnWidth,
  data,
  getCardContent,
  getColumnBgClass,
  keyExtractor,
  columnConfig,
  properties,
  renderFooter,
  rounded = "all",
}: {
  columns: GroupedDataItem<TData>[];
  columnWidth: string;
  data: TData[];
  getCardContent: (item: TData) => React.ReactNode;
  getColumnBgClass: (columnName: string) => string;
  keyExtractor: (item: TData, index: number) => string;
  columnConfig?: GroupByConfig;
  properties: TProperties;
  renderFooter?: (columnKey: string) => React.ReactNode;
  rounded?: "top" | "bottom" | "all";
}) {
  // Transform data with property schema
  const transformedItems = transformData(data, properties) as TData[];

  // Group transformed data by column property
  const { groups: columnGroups } = columnConfig?.propertyId
    ? groupDataByProperty(
        transformedItems,
        columnConfig.propertyId,
        properties,
        {
          showAs: "showAs" in columnConfig ? columnConfig.showAs : undefined,
          startWeekOn:
            columnConfig.propertyType === "date"
              ? columnConfig.startWeekOn
              : undefined,
          numberRange:
            columnConfig.propertyType === "number"
              ? columnConfig.numberRange
              : undefined,
        }
      )
    : { groups: {} as Record<string, TData[]> };

  return (
    <BoardColumns
      cardContent={getCardContent}
      columnWidth={columnWidth}
      getColumnBgClass={getColumnBgClass}
      getItems={(columnKey) => (columnGroups[columnKey] as TData[]) ?? []}
      groups={columns}
      keyExtractor={keyExtractor}
      renderFooter={renderFooter}
      rounded={rounded}
    />
  );
}

/**
 * Suspending board content - uses useInfiniteGroupQuery for load more / infinite scroll.
 */
function SuspendingInfiniteBoardContent<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  columns,
  columnWidth,
  getCardContent,
  getColumnBgClass,
  groupKey,
  keyExtractor,
  pagination,
  columnConfig,
  properties,
  rounded = "all",
}: SuspendingBoardContentProps<TData, TProperties>) {
  return (
    <SuspendingInfiniteGroupContent<TData> groupKey={groupKey}>
      {(result: UseInfiniteGroupQueryResult<TData>) => {
        return (
          <BoardContentRenderer
            columnConfig={columnConfig ?? undefined}
            columns={columns}
            columnWidth={columnWidth}
            data={result.data}
            getCardContent={getCardContent}
            getColumnBgClass={getColumnBgClass}
            keyExtractor={keyExtractor}
            properties={properties}
            renderFooter={
              pagination
                ? (columnKey: string) => {
                    // hasNextPage can be boolean or Record<string, boolean>
                    // Check per-column hasNextPage for board columns
                    const hasNext =
                      typeof result.hasNextPage === "boolean"
                        ? result.hasNextPage
                        : (result.hasNextPage[columnKey] ?? false);

                    // Don't render pagination if this column has no more data
                    if (!hasNext) {
                      return null;
                    }

                    // Build pagination context for this specific column
                    const paginationContext: PaginationContext = {
                      hasMoreThanMax: false,
                      hasNext,
                      isFetching: result.isFetching,
                      isFetchingNextPage: result.isFetchingNextPage,
                      limit: result.limit,
                      onLimitChange: result.onLimitChange,
                      onNext: result.onLoadMore,
                      totalCount: result.data.length,
                    };

                    return (
                      <Pagination
                        context={paginationContext}
                        mode={pagination}
                      />
                    );
                  }
                : undefined
            }
            rounded={rounded}
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

// ============================================================================
// Synced Scroll Container
// ============================================================================

/**
 * SyncedScrollContainer - overflow-x-auto container with hidden scrollbar
 * that registers with the board-level scroll sync.
 */
function SyncedScrollContainer({
  children,
  className,
  register,
}: {
  children: React.ReactNode;
  className?: string;
  register: (el: HTMLElement) => () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    return register(el);
  }, [register]);

  return (
    <div
      className={`overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className ?? ""}`.trim()}
      ref={ref}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Scroll Sync Bar
// ============================================================================

/**
 * ScrollSyncBar - A visible horizontal scrollbar that syncs with all
 * registered scroll containers. Measures content width from sibling
 * scroll containers via MutationObserver.
 */
function ScrollSyncBar({
  register,
}: {
  register: (el: HTMLElement) => () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);

  // Register with scroll sync
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    return register(el);
  }, [register]);

  // Observe DOM to measure content width from sibling scroll containers
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) {
      return;
    }

    const updateWidth = () => {
      // Find any overflow-x-auto sibling/descendant to measure from
      const parent = scrollEl.parentElement;
      if (!parent) {
        return;
      }
      const container = parent.querySelector<HTMLElement>(".overflow-x-auto");
      if (container && container !== scrollEl) {
        setContentWidth(container.scrollWidth);
      }
    };

    // Delay initial check to allow Suspense children to mount
    const timer = setTimeout(updateWidth, 100);

    const observer = new MutationObserver(updateWidth);
    const parent = scrollEl.parentElement;
    if (parent) {
      observer.observe(parent, { childList: true, subtree: true });
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className="sticky bottom-0 overflow-x-auto"
      ref={scrollRef}
      style={
        contentWidth === 0 ? { visibility: "hidden", height: 0 } : undefined
      }
    >
      <div style={{ width: contentWidth, height: 1 }} />
    </div>
  );
}
