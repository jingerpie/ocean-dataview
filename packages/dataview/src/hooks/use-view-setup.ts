import { useEffect, useMemo, useRef } from "react";
import { transformData, validatePropertyKeys } from "../lib/utils";
import type { DataViewProperty } from "../types";
import type { GroupedDataItem } from "./use-group-config";
import { useGroupConfig } from "./use-group-config";
import type { GroupInfiniteInfo } from "./use-group-infinite-pagination";
import type { GroupInfo } from "./use-group-page-pagination";

/**
 * Group configuration for views
 */
export interface ViewGroupConfig {
  /** Property ID to group by */
  groupBy: string;
  /** How to display the grouping */
  showAs?: "day" | "week" | "month" | "year" | "relative" | "group" | "option";
  /** Week start day for week grouping */
  startWeekOn?: "monday" | "sunday";
  /** Sort direction for groups */
  sort?: "propertyAscending" | "propertyDescending";
  /** Hide empty groups */
  hideEmptyGroups?: boolean;
}

/**
 * Options for useViewSetup hook
 */
export interface UseViewSetupOptions<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  /** Raw data from context */
  data: TData[];
  /** Property definitions */
  properties: TProperties;
  /** Group configuration from view props */
  groupBy?: ViewGroupConfig;
  /** Property visibility from view props (initial state) */
  viewPropertyVisibility?: string[];
  /** Context property visibility (current state) */
  contextPropertyVisibility?: string[];
  /** Context pagination state */
  contextPagination?: unknown;
  /** Setter for property visibility */
  setPropertyVisibility: (visibility: string[]) => void;
  /** Additional property IDs to exclude (e.g., cardPreview) */
  additionalExcludeKeys?: string[];
}

/**
 * Result from useViewSetup hook
 */
export interface UseViewSetupResult<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  /** Transformed data with property IDs as keys */
  transformedData: TData[];
  /** Whether using grouped pagination from context */
  hasGroupedPagination: boolean;
  /** Group configuration for useGroupConfig hook */
  groupConfig:
    | {
        groupBy: string;
        showAs?: ViewGroupConfig["showAs"];
        startWeekOn?: ViewGroupConfig["startWeekOn"];
        sort?: ViewGroupConfig["sort"];
        hideEmptyGroups?: boolean;
      }
    | undefined;
  /** Grouped data items (from server or client) */
  groupedData: GroupedDataItem<TData>[] | null;
  /** Property used for grouping */
  groupByProperty: TProperties[number] | undefined;
  /** Validation error message from useGroupConfig */
  validationError: string | null;
  /** Property key validation error */
  propertyValidationError: string | undefined;
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
  groupBy,
  viewPropertyVisibility,
  contextPagination,
  setPropertyVisibility,
}: UseViewSetupOptions<TData, TProperties>): UseViewSetupResult<
  TData,
  TProperties
> {
  // Pattern 1: Sync view.propertyVisibility to context state ONLY on mount
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current && viewPropertyVisibility) {
      setPropertyVisibility(viewPropertyVisibility);
      hasInitialized.current = true;
    }
  }, [viewPropertyVisibility, setPropertyVisibility]);

  // Pattern 3: Validate property keys
  const propertyValidationError = useMemo(
    () => validatePropertyKeys(properties),
    [properties]
  );

  // Pattern 4: Transform data FIRST before grouping
  const transformedData = useMemo(() => {
    return transformData(data as TData[], properties) as TData[];
  }, [data, properties]);

  // Pattern 5: Check if we're using grouped pagination from context
  const hasGroupedPagination = Boolean(
    contextPagination &&
      typeof contextPagination === "object" &&
      "groups" in contextPagination
  );

  // Pattern 6: Prepare group configuration (only needed for client-side grouping)
  const groupConfig = useMemo(() => {
    if (!groupBy || hasGroupedPagination) {
      return undefined;
    }
    return {
      groupBy: String(groupBy.groupBy),
      showAs: groupBy.showAs,
      startWeekOn: groupBy.startWeekOn,
      sort: groupBy.sort,
      hideEmptyGroups: groupBy.hideEmptyGroups,
    };
  }, [groupBy, hasGroupedPagination]);

  // Pattern 7: Use shared hook for group configuration and processing (client-side grouping)
  const {
    groupedData: clientGroupedData,
    validationError,
    groupByProperty: clientGroupByProperty,
  } = useGroupConfig(transformedData, properties, groupConfig);

  // Pattern 8: Get groupBy property for header display
  const groupByProperty = useMemo(() => {
    if (hasGroupedPagination && groupBy?.groupBy) {
      // Server pagination - find property manually
      return properties.find((p) => String(p.id) === groupBy.groupBy);
    }
    // Client grouping - use from hook
    return clientGroupByProperty;
  }, [hasGroupedPagination, groupBy, properties, clientGroupByProperty]);

  // Pattern 9: Choose grouped data source: pagination.groups (server) or useGroupConfig (client)
  const groupedData = useMemo(() => {
    if (
      hasGroupedPagination &&
      contextPagination &&
      typeof contextPagination === "object" &&
      "groups" in contextPagination
    ) {
      // Convert pagination.groups to GroupedDataItem format
      const paginationWithGroups = contextPagination as {
        groups: Array<GroupInfo<TData> | GroupInfiniteInfo<TData>>;
      };
      return paginationWithGroups.groups.map(
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

  return {
    transformedData,
    hasGroupedPagination,
    groupConfig,
    groupedData,
    groupByProperty,
    validationError,
    propertyValidationError,
  };
}
