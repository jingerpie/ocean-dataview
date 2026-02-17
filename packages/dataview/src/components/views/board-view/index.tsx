"use client";

import { AlertCircle, Columns3 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
  GroupedDataItem,
  GroupInfiniteInfo,
  GroupInfo,
} from "../../../hooks";
import { useDisplayProperties, useGroupConfig } from "../../../hooks";
import { useDataViewContext } from "../../../lib/providers/data-view-context";
import {
  buildPaginationContext,
  cn,
  getBadgeBgTransparentClass,
  groupByProperty as groupDataByProperty,
  transformData,
  validatePropertyKeys,
} from "../../../lib/utils";
import { getBoardCardDimensions } from "../../../lib/utils/get-card-sizes";
import type { BadgeColor, DataViewProperty, GroupCounts } from "../../../types";
import { Accordion } from "../../ui/accordion";
import { Badge } from "../../ui/badge";
import { EmptyState } from "../../ui/empty-state";
import { GroupSection } from "../../ui/group-section";
import { type PaginationMode, renderPagination } from "../../ui/paginations";
import { DataCard } from "../data-card";
import { DataCell } from "../data-cell";
import { BoardColumnHeaders } from "./board-column-headers";
import { BoardColumns } from "./board-columns";

export interface BoardViewProps<
  TData,
  TProperties extends
    readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
> {
  /**
   * Layout configuration
   */
  layout?: {
    /** Property ID for card preview image (references property.id, not data key) */
    cardPreview?: TProperties[number]["id"];
    cardSize?: "small" | "medium" | "large"; // default: 'medium'
    fitMedia?: boolean; // default: true (object-cover vs object-contain)
    wrapAllProperties?: boolean; // default: false
    colorColumns?: boolean; // default: false
    showPropertyNames?: boolean; // default: false
  };

  /**
   * View configuration
   */
  view?: {
    propertyVisibility?: TProperties[number]["id"][];

    /**
     * Group By configuration - creates board columns
     * If not specified, will auto-select the first status or select property
     */
    group?: {
      /** Property ID to group by (references property.id, not data key) */
      groupBy?: TProperties[number]["id"];
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
      /** Display aggregation counts in column headers (default: true) */
      showAggregation?: boolean;
    };

    /**
     * Sub-Group By configuration - secondary grouping within columns (optional)
     */
    subGroup?: {
      /** Property ID to sub-group by (references property.id, not data key) */
      subGroupBy: TProperties[number]["id"];
      /**
       * How to sub-group the data:
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
      /** Sort sub-groups by property value (default: 'propertyAscending') */
      sort?: "propertyAscending" | "propertyDescending";
      /** Hide sub-groups with no items (default: true) */
      hideEmptyGroups?: boolean;
      /** Default expanded sub-groups (array of group keys) - for uncontrolled mode */
      defaultExpanded?: string[];
      /** Controlled sub-group expansion state (array of expanded sub-group keys) */
      expandedSubGroups?: string[];
      /** Callback when sub-group expansion changes */
      onExpandedSubGroupsChange?: (groups: string[]) => void;
    };
  };

  /**
   * Card click handler
   */
  onCardClick?: (item: TData) => void;

  /**
   * Function to extract unique key from item
   */
  keyExtractor?: (item: TData, index: number) => string;

  /**
   * Pagination mode for the board.
   * - "page": Classic prev/next pagination with "Showing X-Y"
   * - "loadMore": "Load more" button
   * - "infiniteScroll": Auto-load on scroll
   * - undefined: No pagination UI
   *
   * For boards: renders at bottom of each column
   */
  pagination?: PaginationMode;

  /**
   * Additional className
   */
  className?: string;

  /**
   * Group counts from server (for rendering column headers with server-side counts)
   * Only needed when using server-side pagination.
   */
  counts?: GroupCounts;
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
  layout = {},
  view = {},
  onCardClick,
  keyExtractor = (item, index) => String((item as { id?: string }).id || index),
  pagination,
  className,
  counts: _counts,
}: BoardViewProps<TData, TProperties>) {
  // Get data and properties from context
  const {
    data,
    properties,
    pagination: contextPagination,
    setPropertyVisibility,
    counts: contextCounts,
  } = useDataViewContext<TData, TProperties>();

  // Use prop counts if provided, otherwise fall back to context
  const viewCounts = _counts ? { group: _counts } : contextCounts;
  const counts = viewCounts?.group;
  const subGroupCounts = viewCounts?.subGroup;

  // Check if we're using grouped pagination from context
  const hasGroupedPagination =
    contextPagination && "groups" in contextPagination;

  // Apply layout defaults
  const {
    cardPreview,
    cardSize = "medium",
    fitMedia = true,
    wrapAllProperties = false,
    colorColumns = false,
    showPropertyNames = false,
  } = layout;

  // Extract view configuration with defaults
  const {
    propertyVisibility: viewPropertyVisibility,
    group: groupConfig,
    subGroup: subGroupConfig,
  } = view;

  // Sync view.propertyVisibility to context state ONLY on mount (initial state)
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current && viewPropertyVisibility) {
      setPropertyVisibility(viewPropertyVisibility);
      hasInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewPropertyVisibility, setPropertyVisibility]);

  // Always use context state (which can be controlled by DataViewOptions)
  const { propertyVisibility } = useDataViewContext<TData, TProperties>();

  // Validate property keys
  const propertyValidationError = useMemo(
    () => validatePropertyKeys(properties),
    [properties]
  );

  // Transform data FIRST before grouping (so grouping only works with property IDs)
  const transformedData = useMemo(() => {
    return transformData(data as TData[], properties) as TData[];
  }, [data, properties]);

  // Prepare group configuration for client-side column grouping
  // For sub-grouped boards: always use client-side grouping for columns
  // (pagination.groups = sub-groups/rows, not columns)
  // For non-sub-grouped boards: use server groups if available
  const clientGroupConfig = useMemo(() => {
    if (!groupConfig) {
      return undefined;
    }
    // Always use client-side grouping when sub-groups are present
    // because pagination.groups represents sub-groups, not columns
    if (subGroupConfig || !hasGroupedPagination) {
      return {
        groupBy: String(groupConfig.groupBy),
        showAs: groupConfig.showAs,
        startWeekOn: groupConfig.startWeekOn,
        sort: groupConfig.sort,
        hideEmptyGroups: groupConfig.hideEmptyGroups,
      };
    }
    return undefined;
  }, [groupConfig, hasGroupedPagination, subGroupConfig]);

  // Use shared hook for primary group configuration (with auto-selection)
  // For sub-grouped boards: always required (columns are client-side)
  // For non-sub-grouped boards: skip if using grouped pagination
  const useClientGrouping = !!subGroupConfig || !hasGroupedPagination;
  const {
    groupedData: clientGroupedData,
    validationError: primaryValidationError,
    groupByProperty: clientGroupByProperty,
  } = useGroupConfig(transformedData, properties, clientGroupConfig, {
    required: useClientGrouping,
    autoSelectGroupBy: useClientGrouping,
  });

  // Get groupBy property for header display
  const groupByProperty = useMemo(() => {
    if (hasGroupedPagination && groupConfig?.groupBy) {
      // Server pagination - find property manually
      return properties.find(
        (p) => String(p.id) === String(groupConfig.groupBy)
      );
    }
    // Client grouping - use from hook
    return clientGroupByProperty;
  }, [hasGroupedPagination, groupConfig, properties, clientGroupByProperty]);

  // Choose grouped data source: pagination.groups (server) or useGroupConfig (client)
  // For sub-grouped boards: always use client grouping for columns
  // (pagination.groups = sub-groups/rows, not columns)
  const groupedData = useMemo(() => {
    // For sub-grouped boards OR when using client grouping, use clientGroupedData
    if (useClientGrouping) {
      // When counts are available (prefetched), use them to build columns
      // This ensures columns are visible even when no items are loaded yet
      if (counts) {
        // Build columns from counts, merging with client data if available
        const clientDataMap = new Map(
          (clientGroupedData ?? []).map((g) => [g.key, g])
        );

        return Object.entries(counts).map(([key, countInfo]) => {
          const clientGroup = clientDataMap.get(key);
          return {
            key,
            items: clientGroup?.items ?? [],
            count: countInfo.count,
            displayCount: countInfo.hasMore ? "99+" : String(countInfo.count),
            sortValue: clientGroup?.sortValue ?? key,
          };
        });
      }
      return clientGroupedData;
    }

    // Non-sub-grouped boards with grouped pagination: use pagination.groups as columns
    if (hasGroupedPagination && "groups" in contextPagination) {
      // Convert pagination.groups to GroupedDataItem format
      // Groups can be either GroupInfo (page) or GroupInfiniteInfo (infinite)
      // Counts come from context.counts, not from group objects
      return contextPagination.groups.map(
        (group: GroupInfo<TData> | GroupInfiniteInfo<TData>) => {
          const countInfo = counts?.[group.key];
          return {
            key: group.key,
            items: transformData(group.items, properties) as TData[],
            count: countInfo?.count ?? group.items.length,
            displayCount: countInfo?.hasMore
              ? "99+"
              : String(countInfo?.count ?? group.items.length),
            sortValue: group.value,
          };
        }
      );
    }

    return clientGroupedData;
  }, [
    useClientGrouping,
    hasGroupedPagination,
    contextPagination,
    clientGroupedData,
    properties,
    counts,
  ]);

  // Use shared hook for sub-group configuration (if present)
  const { validationError: subGroupValidationError } = useGroupConfig(
    transformedData,
    properties,
    subGroupConfig
      ? {
          groupBy: String(subGroupConfig.subGroupBy),
          showAs: subGroupConfig.showAs,
          startWeekOn: subGroupConfig.startWeekOn,
          sort: subGroupConfig.sort,
          hideEmptyGroups: subGroupConfig.hideEmptyGroups,
        }
      : undefined
  );

  // Combine validation errors
  const validationError =
    primaryValidationError ||
    subGroupValidationError ||
    propertyValidationError;

  // Prepare effectiveSubGroupConfig for DataBoard component
  const effectiveSubGroupConfig = useMemo(() => {
    if (!subGroupConfig) {
      return undefined;
    }

    return {
      subGroupBy: subGroupConfig.subGroupBy,
      showAs: subGroupConfig.showAs,
      startWeekOn: subGroupConfig.startWeekOn,
      sort: subGroupConfig.sort ?? "propertyAscending",
      hideEmptyGroups: subGroupConfig.hideEmptyGroups ?? true,
      defaultExpanded: subGroupConfig.defaultExpanded,
      expandedSubGroups: subGroupConfig.expandedSubGroups,
      onExpandedSubGroupsChange: subGroupConfig.onExpandedSubGroupsChange,
      counts: subGroupCounts,
    };
  }, [subGroupConfig, subGroupCounts]);

  // Get group options from property config
  const groupOptions = useMemo(() => {
    if (!groupByProperty) {
      return [];
    }

    if (groupByProperty.type === "select") {
      return groupByProperty.config?.options || [];
    }

    if (groupByProperty.type === "status") {
      // Status config uses groups structure - flatten all options with their group colors
      const groups = groupByProperty.config?.groups || [];
      return groups.flatMap((group) =>
        group.options.map((value) => ({ value, color: group.color }))
      );
    }

    if (groupByProperty.type === "multiSelect") {
      return groupByProperty.config?.options || [];
    }

    return [];
  }, [groupByProperty]);

  // Use shared hook for display properties filtering
  // Note: We no longer exclude cardPreview, groupBy, or subGroupBy here - they should be toggleable in Visibility
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
  // Returns transparent for non-badge types, colored backgrounds for badge types (select, multi-select, status)
  const getColumnBgClass = (groupName: string): string => {
    // Use transparent background for non-badge types or when colorColumns is disabled
    if (
      !(colorColumns && groupByProperty) ||
      (groupByProperty.type !== "select" &&
        groupByProperty.type !== "multiSelect" &&
        groupByProperty.type !== "status")
    ) {
      return "bg-transparent";
    }

    // Helper to convert color name to background class
    const getBgClass = (color: string) =>
      getBadgeBgTransparentClass(color as BadgeColor);

    // For status properties with showAs: "group"
    if (groupByProperty.type === "status" && groupConfig?.showAs === "group") {
      const statusGroupMap: Record<string, BadgeColor> = {
        "To Do": "gray",
        "In Progress": "blue",
        Complete: "green",
        Canceled: "red",
      };
      const color = statusGroupMap[groupName];
      if (color) {
        return getBgClass(color);
      }
    }

    // Find the option by value
    const option = groupOptions.find((opt) => opt.value === groupName);

    if (!option) {
      return getBgClass("gray");
    }

    // Use color from option if defined (select, multi-select, or status)
    const color = (("color" in option ? option.color : undefined) ||
      "gray") as BadgeColor;
    return getBgClass(color);
  };

  // Get column header content using property-based rendering
  const getColumnHeader = (groupName: string, count: number) => {
    const showAggregation = groupConfig?.showAggregation ?? true;
    const displayCount = count > 99 ? "99+" : count;

    return (
      <div className="flex items-center gap-2">
        {groupByProperty ? (
          <DataCell
            allProperties={properties}
            item={{} as TData}
            property={groupByProperty}
            value={groupName}
          />
        ) : (
          <Badge variant="gray-subtle">{groupName}</Badge>
        )}
        {showAggregation && (
          <span className="font-medium text-muted-foreground text-xs">
            {displayCount}
          </span>
        )}
      </div>
    );
  };

  // Error state
  if (validationError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/5 p-8">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <p className="font-medium text-destructive">
          Invalid board configuration
        </p>
        <p className="mt-2 text-muted-foreground text-sm">{validationError}</p>
      </div>
    );
  }

  // Empty state - check based on groupedData (columns)
  // For sub-grouped boards with counts, columns come from counts, not pagination.groups
  // For non-sub-grouped boards, columns come from pagination.groups or clientGroupedData
  const isEmpty = !groupedData || groupedData.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
        description="There are no items to display"
        icon={Columns3}
        title="No items available"
      />
    );
  }

  // Use groupedData from useGroupConfig
  const groups: GroupedDataItem<TData>[] = groupedData || [];

  // Build footer renderer using pagination mode
  // For sub-grouped boards: key is subGroupKey (e.g., "In stock")
  // For non-sub-grouped boards: key is columnKey (e.g., "Accessories")
  // hasNext is automatically handled by buildPaginationContext from pagination.groups[].hasNext
  const renderFooter = pagination
    ? (key: string) => {
        const ctx = buildPaginationContext(contextPagination, key);
        return renderPagination(pagination, ctx);
      }
    : undefined;

  // === Sub-grouping logic (for sub-grouped boards) ===

  // Find the subGroupBy property definition
  const subGroupByPropertyDef = useMemo(() => {
    if (!effectiveSubGroupConfig) {
      return undefined;
    }
    return properties.find(
      (prop) => prop.id === effectiveSubGroupConfig.subGroupBy
    );
  }, [properties, effectiveSubGroupConfig]);

  // Collect all unique sub-group keys across all groups and sort them
  const allSubGroupData = useMemo(() => {
    if (!effectiveSubGroupConfig) {
      return [];
    }

    // Flatten all items from all groups
    const allItems = groups.flatMap((g) => g.items);
    const subGroupCountsData = effectiveSubGroupConfig.counts;

    if (allItems.length === 0 && !subGroupCountsData) {
      return [];
    }

    const { groups: subGroups, sortValues } = groupDataByProperty(
      allItems,
      effectiveSubGroupConfig.subGroupBy,
      properties,
      effectiveSubGroupConfig.showAs,
      effectiveSubGroupConfig.startWeekOn
    );

    // Get all unique sub-group keys (from either client data or server counts)
    const allSubGroupKeys = new Set([
      ...Object.keys(subGroups),
      ...Object.keys(subGroupCountsData ?? {}),
    ]);

    // Build sub-group array with counts
    const subGroupArray = Array.from(allSubGroupKeys).map((key) => {
      const serverCount = subGroupCountsData?.[key];
      const clientItems = subGroups[key] as TData[] | undefined;
      const clientCount = clientItems?.length ?? 0;

      // Prefer server counts when available
      const count = serverCount?.count ?? clientCount;
      const hasMore = serverCount?.hasMore ?? false;

      return {
        key,
        items: [] as TData[], // Items will be fetched via getItemsForCell
        count,
        displayCount: hasMore || count > 99 ? "99+" : String(count),
        sortValue: sortValues[key] ?? key,
      };
    });

    // Sort sub-groups
    const sortOrder = effectiveSubGroupConfig.sort ?? "propertyAscending";
    subGroupArray.sort((a, b) => {
      const multiplier = sortOrder === "propertyDescending" ? -1 : 1;
      if (typeof a.sortValue === "number" && typeof b.sortValue === "number") {
        return (a.sortValue - b.sortValue) * multiplier;
      }
      return (
        String(a.sortValue).localeCompare(String(b.sortValue)) * multiplier
      );
    });

    return subGroupArray;
  }, [groups, effectiveSubGroupConfig, properties]);

  // Get items for a specific cell (column group + sub-group)
  const getItemsForCell = useCallback(
    (groupKey: string, subGroupKey: string): TData[] => {
      if (!effectiveSubGroupConfig) {
        return [];
      }

      const group = groups.find((g) => g.key === groupKey);
      if (!group) {
        return [];
      }

      // Group items by sub-group property
      const { groups: subGroups } = groupDataByProperty(
        group.items,
        effectiveSubGroupConfig.subGroupBy,
        properties,
        effectiveSubGroupConfig.showAs,
        effectiveSubGroupConfig.startWeekOn
      );

      return (subGroups[subGroupKey] as TData[]) || [];
    },
    [groups, effectiveSubGroupConfig, properties]
  );

  // Filter sub-groups based on hideEmptyGroups
  const visibleSubGroups = useMemo(() => {
    if (!effectiveSubGroupConfig) {
      return [];
    }

    const hideEmpty = effectiveSubGroupConfig.hideEmptyGroups ?? true;

    if (!hideEmpty) {
      return allSubGroupData;
    }

    // Filter by count to show groups even when items aren't loaded yet
    return allSubGroupData.filter((subGroup) => subGroup.count > 0);
  }, [allSubGroupData, effectiveSubGroupConfig]);

  // === Render ===

  // Sub-grouped view: BoardColumnHeaders + Accordion with GroupSection + BoardColumns
  if (effectiveSubGroupConfig) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    return (
      <div className={cn("relative max-w-full overflow-clip", className)}>
        <div className="overflow-x-auto pb-4" ref={scrollContainerRef}>
          <div className="min-w-fit">
            {/* Column Headers (sticky) */}
            <BoardColumnHeaders
              columnHeader={getColumnHeader}
              columnWidth={columnWidth}
              containerRef={scrollContainerRef}
              getColumnBgClass={getColumnBgClass}
              groups={groups}
              stickyHeader={{
                enabled: true,
                offset: 56,
              }}
            />

            {/* Sub-group rows using GroupSection */}
            <Accordion
              defaultValue={effectiveSubGroupConfig.defaultExpanded}
              multiple
              onValueChange={effectiveSubGroupConfig.onExpandedSubGroupsChange}
              value={effectiveSubGroupConfig.expandedSubGroups}
            >
              {visibleSubGroups.map((subGroup) => (
                <GroupSection
                  group={subGroup}
                  groupByPropertyDef={subGroupByPropertyDef}
                  key={subGroup.key}
                  showAggregation={true}
                  stickyHeader={{
                    enabled: true,
                    offset: 93, // Higher offset to account for column headers
                  }}
                >
                  <BoardColumns
                    cardContent={getCardContent}
                    columnWidth={columnWidth}
                    getColumnBgClass={getColumnBgClass}
                    getItems={(groupKey) =>
                      getItemsForCell(groupKey, subGroup.key)
                    }
                    groups={groups}
                    keyExtractor={keyExtractor}
                    renderFooter={() => renderFooter?.(subGroup.key)}
                    rounded="all"
                  />
                </GroupSection>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    );
  }

  // Flat view: BoardColumnHeaders + BoardColumns
  const flatScrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cn("relative max-w-full overflow-clip", className)}>
      <div className="overflow-x-auto pb-4" ref={flatScrollContainerRef}>
        <div className="min-w-fit">
          {/* Column Headers */}
          <BoardColumnHeaders
            columnHeader={getColumnHeader}
            columnWidth={columnWidth}
            containerRef={flatScrollContainerRef}
            getColumnBgClass={getColumnBgClass}
            groups={groups}
            rounded="top"
            stickyHeader={{
              enabled: true,
              offset: 56,
            }}
          />

          {/* Column Cards */}
          <BoardColumns
            cardContent={getCardContent}
            columnWidth={columnWidth}
            getColumnBgClass={getColumnBgClass}
            groups={groups}
            keyExtractor={keyExtractor}
            renderFooter={renderFooter}
            rounded="bottom"
          />
        </div>
      </div>
    </div>
  );
}

// Re-export from shared with view-specific aliases
export type { DataViewContextValue as BoardContextValue } from "../../../lib/providers/data-view-context";
// biome-ignore lint/performance/noBarrelFile: Re-exporting shared components with view-specific names
export { useDataViewContext as useBoardContext } from "../../../lib/providers/data-view-context";
export type { DataViewProviderProps as BoardProviderProps } from "../../../lib/providers/data-view-provider";
export { DataViewProvider as BoardProvider } from "../../../lib/providers/data-view-provider";
// Re-export GroupCounts from types for backwards compatibility
export type { GroupCounts } from "../../../types";
export {
  Visibility,
  type VisibilityProps,
} from "../../ui/toolbar/visibility";
// Skeleton
export { BoardSkeleton } from "./board-skeleton";
