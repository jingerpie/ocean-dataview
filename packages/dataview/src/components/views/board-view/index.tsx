"use client";

import { AlertCircle, Columns3 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
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
  transformData,
  validatePropertyKeys,
} from "../../../lib/utils";
import { getBoardCardDimensions } from "../../../lib/utils/get-card-sizes";
import type { DataViewProperty } from "../../../types";
import { Badge } from "../../ui/badge";
import { Card, CardContent } from "../../ui/card";
import { EmptyState } from "../../ui/empty-state";
import { type PaginationMode, renderPagination } from "../../ui/paginations";
import { DataCell } from "../data-cell";
import { BoardColumnCard } from "./board-column-card";
import { BoardRowLayout } from "./board-row-layout";

// Board-specific types for group counts
/** Single-level group counts */
export type GroupCounts = Record<string, { count: number; hasMore: boolean }>;

/** Two-level group counts (with sub-groups) */
export type GroupCountsWithSubGroups = Record<
  string,
  {
    count: number;
    hasMore: boolean;
    subGroups: Record<string, { count: number; hasMore: boolean }>;
  }
>;

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
   * Only needed when using server-side pagination
   */
  counts?: GroupCounts | GroupCountsWithSubGroups;
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
    setExcludedPropertyIds,
    setPropertyVisibility,
  } = useDataViewContext<TData, TProperties>();

  // Check if we're using grouped pagination from context
  const hasGroupedPagination =
    contextPagination && "groups" in contextPagination;

  // Apply layout defaults
  const {
    cardPreview,
    cardSize = "medium",
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

  // Update excluded properties when groupBy or subGroupBy changes
  useEffect(() => {
    const excluded: TProperties[number]["id"][] = [];
    if (groupConfig?.groupBy) {
      excluded.push(groupConfig.groupBy);
    }
    if (subGroupConfig?.subGroupBy) {
      excluded.push(subGroupConfig.subGroupBy);
    }
    setExcludedPropertyIds(excluded);
  }, [
    groupConfig?.groupBy,
    subGroupConfig?.subGroupBy,
    setExcludedPropertyIds,
  ]);

  // Validate property keys
  const propertyValidationError = useMemo(
    () => validatePropertyKeys(properties),
    [properties]
  );

  // Transform data FIRST before grouping (so grouping only works with property IDs)
  const transformedData = useMemo(() => {
    return transformData(data as TData[], properties) as TData[];
  }, [data, properties]);

  // Prepare group configuration (only needed for client-side grouping)
  const clientGroupConfig = useMemo(() => {
    if (!groupConfig || hasGroupedPagination) {
      return undefined;
    }
    return {
      groupBy: String(groupConfig.groupBy),
      showAs: groupConfig.showAs,
      startWeekOn: groupConfig.startWeekOn,
      sort: groupConfig.sort,
      hideEmptyGroups: groupConfig.hideEmptyGroups,
    };
  }, [groupConfig, hasGroupedPagination]);

  // Use shared hook for primary group configuration (with auto-selection)
  // Skip if using grouped pagination from context
  const {
    groupedData: clientGroupedData,
    validationError: primaryValidationError,
    groupByProperty: clientGroupByProperty,
  } = useGroupConfig(transformedData, properties, clientGroupConfig, {
    required: !hasGroupedPagination,
    autoSelectGroupBy: !hasGroupedPagination,
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
  const groupedData = useMemo(() => {
    if (hasGroupedPagination && "groups" in contextPagination) {
      // Convert pagination.groups to GroupedDataItem format
      // Groups can be either GroupInfo (page) or GroupInfiniteInfo (infinite)
      return contextPagination.groups.map(
        (group: GroupInfo<TData> | GroupInfiniteInfo<TData>) => ({
          key: group.key,
          items: transformData(group.items, properties) as TData[],
          count: group.count,
          displayCount: group.displayCount,
          sortValue: group.value,
        })
      );
    }
    return clientGroupedData;
  }, [hasGroupedPagination, contextPagination, clientGroupedData, properties]);

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
    };
  }, [subGroupConfig]);

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

  // Use shared hook for display properties filtering (exclude groupBy and preview)
  const activeGroupBy = groupByProperty?.id;
  const excludeKeys = [cardPreview, activeGroupBy].filter(
    (key): key is string => key !== undefined
  );
  const displayProperties = useDisplayProperties(
    properties,
    propertyVisibility,
    excludeKeys
  );

  // Get card dimensions based on size
  const { imageHeight, columnWidth } = getBoardCardDimensions(cardSize);

  // Get card content
  const getCardContent = (item: TData) => {
    // Handle cardPreview - if it's an array, use the first element
    const previewValue = cardPreview
      ? (item as Record<string, unknown>)[cardPreview]
      : null;
    const imageUrl = Array.isArray(previewValue)
      ? previewValue[0]
      : (previewValue as string);

    return (
      <Card
        className={cn(
          "gap-0 overflow-hidden py-0 transition-all hover:shadow-lg",
          onCardClick && "cursor-pointer"
        )}
        onClick={() => onCardClick?.(item)}
      >
        {/* Image Preview */}
        {imageUrl && (
          <div className="relative bg-muted" style={{ height: imageHeight }}>
            <Image
              alt="Preview"
              className="object-cover"
              fill
              loading="lazy"
              src={imageUrl}
            />
          </div>
        )}

        {/* Card Content */}
        <CardContent className="flex flex-col gap-2 p-3">
          {displayProperties.map((property) => {
            const value = (item as Record<string, unknown>)[property.id];

            return (
              <div
                className={cn(
                  "flex flex-col items-start",
                  (property.type === "select" ||
                    property.type === "multiSelect" ||
                    property.type === "status" ||
                    property.type === "filesMedia") &&
                    "gap-1"
                )}
                key={String(property.id)}
              >
                {showPropertyNames && (
                  <span className="text-muted-foreground text-xs">
                    {property.label ?? String(property.id)}
                  </span>
                )}
                <DataCell
                  allProperties={properties}
                  item={item}
                  property={property}
                  value={value}
                  wrap={wrapAllProperties}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

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
    const getBgClass = (color: string) => `bg-badge-${color}-subtle/30`;

    // For status properties with showAs: "group"
    if (groupByProperty.type === "status" && groupConfig?.showAs === "group") {
      const statusGroupMap: Record<string, string> = {
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
    const color = ("color" in option ? option.color : undefined) || "gray";
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

  // Empty state - check both client-side and server-side cases
  const isEmpty = hasGroupedPagination
    ? contextPagination.groups.length === 0
    : Array.isArray(data) && (data.length === 0 || !groupedData);

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

  // Build column footer renderer using pagination mode
  const renderColumnFooter = pagination
    ? (groupKey: string) => {
        const ctx = buildPaginationContext(contextPagination, groupKey);
        return renderPagination(pagination, ctx);
      }
    : undefined;

  // Use BoardRowLayout for sub-grouped boards (Notion-style full-width sub-groups)
  // Use BoardColumnCard for non-sub-grouped boards (flat columns)
  if (effectiveSubGroupConfig) {
    return (
      <BoardRowLayout
        cardContent={getCardContent}
        className={className}
        columnHeader={getColumnHeader}
        columnWidth={columnWidth}
        getColumnBgClass={getColumnBgClass}
        groups={groups}
        keyExtractor={keyExtractor}
        properties={properties}
        renderColumnFooter={renderColumnFooter}
        stickyHeader={{
          enabled: true,
          offset: 56,
        }}
        subGroup={effectiveSubGroupConfig}
      />
    );
  }

  return (
    <BoardColumnCard
      cardContent={getCardContent}
      className={className}
      columnHeader={getColumnHeader}
      columnWidth={columnWidth}
      getColumnBgClass={getColumnBgClass}
      groups={groups}
      keyExtractor={keyExtractor}
      renderColumnFooter={renderColumnFooter}
    />
  );
}

// Re-export from shared with view-specific aliases
export type { DataViewContextValue as BoardContextValue } from "../../../lib/providers/data-view-context";
// biome-ignore lint/performance/noBarrelFile: Re-exporting shared components with view-specific names
export { useDataViewContext as useBoardContext } from "../../../lib/providers/data-view-context";
export type { DataViewProviderProps as BoardProviderProps } from "../../../lib/providers/data-view-provider";
export { DataViewProvider as BoardProvider } from "../../../lib/providers/data-view-provider";
export {
  Visibility,
  type VisibilityProps,
} from "../../ui/toolbar/visibility";
// Skeleton
export { BoardSkeleton } from "./board-skeleton";
// Note: GroupCounts and GroupCountsWithSubGroups are exported at top of file
