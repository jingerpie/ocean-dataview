import { useMemo } from "react";
import type { GroupConfigInput } from "../types/group.type";
import type { ViewCounts } from "../types/pagination-types";
import type { DataViewProperty } from "../types/property.type";
import { transformData } from "../utils/transform-data";
import { validatePropertyKeys } from "../validators/valid-properties";
import type { GroupConfig, GroupedDataItem } from "./use-group-config";
import { useGroupConfig } from "./use-group-config";
import { useGroupParams } from "./use-group-params";
import type { InfiniteGroupInfo } from "./use-infinite-controller";
import type { PageGroupInfo } from "./use-page-controller";

type GroupInfo<TData> = PageGroupInfo<TData> | InfiniteGroupInfo<TData>;

/**
 * Options for useViewSetup hook
 */
export interface UseViewSetupOptions<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  /** Additional property IDs to exclude (e.g., cardPreview) */
  additionalExcludeKeys?: string[];
  /** Context pagination state */
  contextPagination?: unknown;
  /** View counts from context (group counts and sort values) */
  counts?: ViewCounts;
  /** Raw data from context */
  data: TData[];
  /** Group configuration from context (new discriminated union format) */
  group?: GroupConfigInput | null;
  /** Property schema */
  properties: TProperties;
}

/**
 * Result from useViewSetup hook
 */
export interface UseViewSetupResult<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  /** Group config from context (discriminated union) */
  group: GroupConfigInput | undefined;
  /** Property used for grouping */
  groupByProperty: TProperties[number] | undefined;
  /** Group configuration for useGroupConfig hook */
  groupConfig: GroupConfig | undefined;
  /** Grouped data items (from server or client) */
  groupedData: GroupedDataItem<TData>[] | null;
  /** Whether using grouped pagination from context */
  hasGroupedPagination: boolean;
  /** Property key validation error */
  propertyValidationError: string | undefined;
  /** Transformed data with property IDs as keys */
  transformedData: TData[];
  /** Validation error message from useGroupConfig */
  validationError: string | null;
}

/**
 * Shared hook for common view setup logic
 * Extracts duplicated patterns from TableView, ListView, GalleryView, BoardView
 */
export function useViewSetup<
  TData,
  TProperties extends
    readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
>({
  data,
  properties,
  group,
  contextPagination,
  counts,
}: UseViewSetupOptions<TData, TProperties>): UseViewSetupResult<
  TData,
  TProperties
> {
  // Get sort order and hideEmpty from URL params (managed by useGroupParams)
  const { groupSortOrder, hideEmptyGroups } = useGroupParams();

  // Validate property keys
  const propertyValidationError = useMemo(
    () => validatePropertyKeys(properties),
    [properties]
  );

  // Transform data FIRST before grouping
  const transformedData = useMemo(() => {
    return transformData(data as TData[], properties) as TData[];
  }, [data, properties]);

  // Check if we're using grouped pagination from context
  // Groups must be non-empty to be considered "grouped pagination"
  // Empty groups means views use SuspendingGroupContent + counts instead
  const hasGroupedPagination = Boolean(
    contextPagination &&
      typeof contextPagination === "object" &&
      "groups" in contextPagination &&
      Array.isArray((contextPagination as { groups: unknown[] }).groups) &&
      (contextPagination as { groups: unknown[] }).groups.length > 0
  );

  // Prepare group configuration (only needed for client-side grouping)
  // Maps URL format (asc/desc) to internal format (propertyAscending/propertyDescending)
  const groupConfig = useMemo((): GroupConfig | undefined => {
    if (!group || hasGroupedPagination) {
      return undefined;
    }
    const sortMap: Record<string, "propertyAscending" | "propertyDescending"> =
      {
        asc: "propertyAscending",
        desc: "propertyDescending",
      };
    return {
      groupBy: group.propertyId,
      hideEmptyGroups,
      numberRange:
        group.propertyType === "number" ? group.numberRange : undefined,
      showAs: "showAs" in group ? group.showAs : undefined,
      sort: sortMap[groupSortOrder],
      startWeekOn:
        group.propertyType === "date" ? group.startWeekOn : undefined,
    };
  }, [group, hasGroupedPagination, groupSortOrder, hideEmptyGroups]);

  // Use shared hook for group configuration and processing (client-side grouping)
  const {
    groupedData: clientGroupedData,
    validationError,
    groupByProperty: clientGroupByProperty,
  } = useGroupConfig(transformedData, properties, groupConfig);

  // Get groupBy property for header display
  const groupByProperty = useMemo(() => {
    if (hasGroupedPagination && group?.propertyId) {
      // Server pagination - find property manually
      return properties.find((p) => String(p.id) === group.propertyId);
    }
    // Client grouping - use from hook
    return clientGroupByProperty;
  }, [hasGroupedPagination, group, properties, clientGroupByProperty]);

  // Helper to format count for display
  const formatDisplayCount = (
    countInfo: ViewCounts["group"][string] | undefined
  ) => (countInfo?.hasMore ? "99+" : String(countInfo?.count ?? 0));

  // Helper to compare sort values with direction
  const compareSortValues = (
    aVal: string | number,
    bVal: string | number,
    direction: "asc" | "desc"
  ) => {
    let result: number;
    if (typeof aVal === "number" && typeof bVal === "number") {
      result = aVal - bVal;
    } else {
      result = String(aVal).localeCompare(String(bVal));
    }
    return direction === "desc" ? -result : result;
  };

  // Pattern 9: Choose grouped data source: pagination.groups (server) or useGroupConfig (client)
  // Counts come from context (DataViewProvider.counts prop)
  const groupedData = useMemo(() => {
    const groupCounts = counts?.group;
    const groupSortValues = counts?.groupSortValues;

    if (
      hasGroupedPagination &&
      contextPagination &&
      typeof contextPagination === "object" &&
      "groups" in contextPagination
    ) {
      // Convert pagination.groups to GroupedDataItem format
      const paginationWithGroups = contextPagination as {
        groups: GroupInfo<TData>[];
      };
      return paginationWithGroups.groups
        .map((group: GroupInfo<TData>) => {
          // Get counts from context
          const countInfo = groupCounts?.[group.key];
          return {
            key: group.key,
            items: transformData(group.items, properties) as TData[],
            count: countInfo?.count ?? 0,
            displayCount: formatDisplayCount(countInfo),
            sortValue: groupSortValues?.[group.key] ?? group.key,
          };
        })
        .sort((a, b) =>
          compareSortValues(a.sortValue, b.sortValue, groupSortOrder)
        );
    }

    // For client-side grouping, merge counts if available
    // When counts are provided from server, create entries for ALL groups (even empty ones)
    if (groupCounts) {
      // Build a map of loaded items by group key
      const groupedItemsMap = new Map<string, TData[]>();
      if (clientGroupedData) {
        for (const group of clientGroupedData) {
          groupedItemsMap.set(group.key, group.items);
        }
      }

      // Create groups for all keys in counts (from server)
      // Use sortValues from server for proper ordering
      return Object.entries(groupCounts)
        .map(([key, countInfo]) => ({
          key,
          items: groupedItemsMap.get(key) ?? [],
          count: countInfo.count,
          displayCount: formatDisplayCount(countInfo),
          sortValue: groupSortValues?.[key] ?? key,
        }))
        .sort((a, b) =>
          compareSortValues(a.sortValue, b.sortValue, groupSortOrder)
        );
    }

    return clientGroupedData;
  }, [
    hasGroupedPagination,
    contextPagination,
    clientGroupedData,
    properties,
    counts,
    groupSortOrder,
  ]);

  return {
    groupByProperty,
    groupConfig,
    groupedData,
    hasGroupedPagination,
    group: group ?? undefined,
    propertyValidationError,
    transformedData,
    validationError,
  };
}
