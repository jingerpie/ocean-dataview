import { useMemo } from "react";
import {
  type ParsedGroupConfig,
  parseGroupByConfig,
  transformData,
  validatePropertyKeys,
} from "../lib/utils";
import type { DataViewProperty, GroupConfig, GroupCounts } from "../types";
import type { GroupedDataItem } from "./use-group-config";
import { useGroupConfig } from "./use-group-config";
import type { GroupInfiniteInfo } from "./use-group-infinite-pagination";
import type { GroupInfo } from "./use-group-page-pagination";

/**
 * Internal group config format used by useGroupConfig hook
 */
interface InternalGroupConfig {
  groupBy: string;
  hideEmptyGroups?: boolean;
  showAs?: "day" | "week" | "month" | "year" | "relative" | "group" | "option";
  sort?: "propertyAscending" | "propertyDescending";
  startWeekOn?: "monday" | "sunday";
}

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
  /** Group counts from context (for group headers) */
  counts?: GroupCounts;
  /** Raw data from context */
  data: TData[];
  /** Group configuration from context (new discriminated union format) */
  group?: GroupConfig;
  /** Property definitions */
  properties: TProperties;
}

/**
 * Result from useViewSetup hook
 */
export interface UseViewSetupResult<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  /** Property used for grouping */
  groupByProperty: TProperties[number] | undefined;
  /** Group configuration for useGroupConfig hook (internal format) */
  groupConfig: InternalGroupConfig | undefined;
  /** Grouped data items (from server or client) */
  groupedData: GroupedDataItem<TData>[] | null;
  /** Whether using grouped pagination from context */
  hasGroupedPagination: boolean;
  /** Parsed group config from discriminated union */
  parsedGroup: ParsedGroupConfig | undefined;
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
  // Parse the discriminated union group config
  const parsedGroup = useMemo(
    () => (group ? parseGroupByConfig(group) : undefined),
    [group]
  );

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
  const hasGroupedPagination = Boolean(
    contextPagination &&
      typeof contextPagination === "object" &&
      "groups" in contextPagination
  );

  // Prepare internal group configuration (only needed for client-side grouping)
  // Maps new format (ascending/descending) to old format (propertyAscending/propertyDescending)
  const groupConfig = useMemo((): InternalGroupConfig | undefined => {
    if (!parsedGroup || hasGroupedPagination) {
      return undefined;
    }
    // Map sort values from new format to internal format
    const sortMap: Record<string, "propertyAscending" | "propertyDescending"> =
      {
        ascending: "propertyAscending",
        descending: "propertyDescending",
      };
    return {
      groupBy: parsedGroup.property,
      showAs: parsedGroup.showAs,
      startWeekOn: parsedGroup.startWeekOn,
      sort: group?.sort ? sortMap[group.sort] : undefined,
      hideEmptyGroups: group?.hideEmpty,
    };
  }, [parsedGroup, hasGroupedPagination, group?.sort, group?.hideEmpty]);

  // Use shared hook for group configuration and processing (client-side grouping)
  const {
    groupedData: clientGroupedData,
    validationError,
    groupByProperty: clientGroupByProperty,
  } = useGroupConfig(transformedData, properties, groupConfig);

  // Get groupBy property for header display
  const groupByProperty = useMemo(() => {
    if (hasGroupedPagination && parsedGroup?.property) {
      // Server pagination - find property manually
      return properties.find((p) => String(p.id) === parsedGroup.property);
    }
    // Client grouping - use from hook
    return clientGroupByProperty;
  }, [hasGroupedPagination, parsedGroup, properties, clientGroupByProperty]);

  // Helper to format count for display
  const formatDisplayCount = (countInfo: GroupCounts[string]) =>
    countInfo.hasMore ? "99+" : String(countInfo.count);

  // Pattern 9: Choose grouped data source: pagination.groups (server) or useGroupConfig (client)
  // Counts come from context (DataViewProvider.counts prop)
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
        (group: GroupInfo<TData> | GroupInfiniteInfo<TData>) => {
          // Get counts from context
          const countInfo = counts?.[group.key];
          return {
            key: group.key,
            items: transformData(group.items, properties) as TData[],
            count: countInfo?.count ?? 0,
            displayCount: countInfo ? formatDisplayCount(countInfo) : "0",
            sortValue: group.value,
          };
        }
      );
    }

    // For client-side grouping, merge counts if available
    if (clientGroupedData && counts) {
      return clientGroupedData.map((group) => {
        const countInfo = counts[group.key];
        if (countInfo) {
          return {
            ...group,
            count: countInfo.count,
            displayCount: formatDisplayCount(countInfo),
          };
        }
        return group;
      });
    }

    return clientGroupedData;
  }, [
    hasGroupedPagination,
    contextPagination,
    clientGroupedData,
    properties,
    counts,
  ]);

  return {
    groupByProperty,
    groupConfig,
    groupedData,
    hasGroupedPagination,
    parsedGroup,
    propertyValidationError,
    transformedData,
    validationError,
  };
}
