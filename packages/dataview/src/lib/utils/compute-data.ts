import type { ComputationType, DataViewProperty } from "../../types";
import { getUserLocale } from "./locale-helpers";

export type { ComputationType } from "../../types";

/** Regex for matching uppercase A-Z letters */
const UPPERCASE_LETTER_REGEX = /[A-Z]/;

export interface GroupedDataWithMeta<TData> {
  groups: Record<string, TData[]>;
  sortValues: Record<string, string | number>; // Mapping of group key to sortable value
}

interface GroupResult {
  groupKey: string;
  sortValue: string | number;
}

/**
 * Handle date property grouping
 */
function handleDateGrouping(
  value: unknown,
  showAs: "day" | "week" | "month" | "year" | "relative",
  startWeekOn?: "monday" | "sunday"
): GroupResult {
  const date = new Date(value as string);

  switch (showAs) {
    case "relative":
      return {
        groupKey: getRelativeDateGroup(date),
        sortValue: date.getTime(),
      };
    case "day":
      return {
        groupKey: date.toLocaleDateString(getUserLocale(), {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        sortValue: date.getTime(),
      };
    case "week": {
      const weekStartDay = startWeekOn || "sunday";
      return {
        groupKey: formatWeekRange(date, weekStartDay),
        sortValue: getWeekStart(date, weekStartDay).getTime(),
      };
    }
    case "month":
      return {
        groupKey: date.toLocaleDateString(getUserLocale(), {
          month: "short",
          year: "numeric",
        }),
        sortValue: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
      };
    case "year":
      return {
        groupKey: date.getFullYear().toString(),
        sortValue: new Date(date.getFullYear(), 0, 1).getTime(),
      };
    default:
      return { groupKey: String(value), sortValue: String(value) };
  }
}

// New StatusConfig type: { groups: Array<{ label: string; color: string; options: string[] }> }
interface StatusConfigNew {
  groups?: Array<{ label: string; color: string; options: string[] }>;
}

/**
 * Handle status property grouping by group (using group labels)
 */
function handleStatusGroupGrouping(
  value: unknown,
  config?: StatusConfigNew,
  emptyLabel?: string
): GroupResult {
  const statusValue = String(value);

  // Find which group this option belongs to
  if (config?.groups) {
    for (let groupIndex = 0; groupIndex < config.groups.length; groupIndex++) {
      const group = config.groups[groupIndex];
      if (group?.options.includes(statusValue)) {
        return {
          groupKey: group.label,
          sortValue: groupIndex,
        };
      }
    }
  }

  return {
    groupKey: emptyLabel || String(value),
    sortValue: Number.MAX_SAFE_INTEGER,
  };
}

/**
 * Handle status property grouping by option (individual status values)
 */
function handleStatusOptionGrouping(
  value: unknown,
  config?: StatusConfigNew,
  emptyLabel?: string
): GroupResult {
  const statusValue = String(value);

  // Find which group this option belongs to and its position
  if (config?.groups) {
    for (let groupIndex = 0; groupIndex < config.groups.length; groupIndex++) {
      const group = config.groups[groupIndex];
      const optionIndex = group?.options.indexOf(statusValue) ?? -1;
      if (optionIndex !== -1) {
        return {
          groupKey: statusValue,
          sortValue: groupIndex * 1000 + optionIndex,
        };
      }
    }
  }

  return {
    groupKey: emptyLabel || String(value),
    sortValue: Number.MAX_SAFE_INTEGER,
  };
}

/**
 * Handle text property grouping by first letter (alphabetical)
 */
function handleTextAlphabeticalGrouping(value: unknown): GroupResult {
  const text = String(value).trim();
  if (!text) {
    return { groupKey: "#", sortValue: "~" }; // Sort '#' at the end
  }

  const firstChar = text.charAt(0).toUpperCase();

  // Group A-Z letters, everything else as "#"
  if (UPPERCASE_LETTER_REGEX.test(firstChar)) {
    return { groupKey: firstChar, sortValue: firstChar };
  }

  return { groupKey: "#", sortValue: "~" }; // Sort '#' at the end
}

/**
 * Handle number property grouping by range buckets
 */
function handleNumberRangeGrouping(
  value: unknown,
  rangeConfig: { range: [number, number]; step: number }
): GroupResult {
  const num = Number(value);
  const [min, max] = rangeConfig.range;
  const { step } = rangeConfig;

  if (Number.isNaN(num)) {
    return { groupKey: "Unknown", sortValue: Number.MAX_SAFE_INTEGER };
  }

  // Below minimum
  if (num < min) {
    return { groupKey: `< ${min}`, sortValue: min - 1 };
  }

  // At or above maximum
  if (num >= max) {
    return { groupKey: `${max}+`, sortValue: max };
  }

  // Calculate bucket
  const bucketIndex = Math.floor((num - min) / step);
  const bucketStart = bucketIndex * step + min;
  const bucketEnd = bucketStart + step;

  return {
    groupKey: `${bucketStart}-${bucketEnd}`,
    sortValue: bucketStart,
  };
}

export interface GroupingOptions {
  numberRange?: { range: [number, number]; step: number };
  showAs?: "day" | "week" | "month" | "year" | "relative" | "option" | "group";
  startWeekOn?: "monday" | "sunday";
  textShowAs?: "exact" | "alphabetical";
}

/**
 * Get group key and sort value for a data item
 */
function getGroupKeyAndSortValue<TData>(
  value: unknown,
  property: DataViewProperty<TData> | undefined,
  options: GroupingOptions,
  emptyGroupLabel: string
): GroupResult {
  const { showAs, startWeekOn, textShowAs, numberRange } = options;

  // Handle date grouping
  if (
    property?.type === "date" &&
    value &&
    showAs &&
    showAs !== "group" &&
    showAs !== "option"
  ) {
    return handleDateGrouping(value, showAs, startWeekOn);
  }

  // Handle status grouping by group
  if (property?.type === "status" && showAs === "group" && value) {
    const config = property.config as StatusConfigNew;
    return handleStatusGroupGrouping(value, config, emptyGroupLabel);
  }

  // Handle status grouping by option
  if (property?.type === "status" && value) {
    const config = property.config as StatusConfigNew;
    return handleStatusOptionGrouping(value, config, emptyGroupLabel);
  }

  // Handle text alphabetical grouping
  if (property?.type === "text" && textShowAs === "alphabetical" && value) {
    return handleTextAlphabeticalGrouping(value);
  }

  // Handle number range grouping
  if (property?.type === "number" && numberRange && value !== undefined) {
    return handleNumberRangeGrouping(value, numberRange);
  }

  // Handle checkbox grouping - use "true"/"false" strings
  // "Checked"/"Unchecked" are display labels only (handled by GroupSection)
  if (property?.type === "checkbox") {
    const boolValue = Boolean(value);
    return {
      groupKey: boolValue ? "true" : "false",
      sortValue: boolValue ? 0 : 1,
    };
  }

  // Default grouping
  return {
    groupKey: String(value || emptyGroupLabel),
    sortValue: String(value || emptyGroupLabel),
  };
}

/**
 * Group data by a property value
 * Handles date, select, status, and other property types
 * Returns both groups and sort values for proper ordering
 * @param data - Raw data to group
 * @param propertyId - Property ID (references property.id, not data key)
 * @param properties - Property definitions
 * @param options - Grouping options (showAs, startWeekOn, textShowAs, numberRange)
 */
export function groupByProperty<TData>(
  data: TData[],
  propertyId: string,
  properties: readonly DataViewProperty<TData>[],
  options?: GroupingOptions
): GroupedDataWithMeta<TData> {
  const property = properties.find((p) => p.id === propertyId);
  const propertyName = property?.label || propertyId;
  const emptyGroupLabel = `No ${propertyName}`;
  const groups: Record<string, TData[]> = {};
  const sortValues: Record<string, string | number> = {};

  for (const item of data) {
    // Extract value from item
    let value: unknown;
    if (property?.type === "formula") {
      // Formula properties can't be grouped - skip value extraction
      value = null;
    } else {
      // Read from item[propertyId]
      value = (item as Record<string, unknown>)[propertyId];
    }

    const { groupKey, sortValue } = getGroupKeyAndSortValue(
      value,
      property,
      options ?? {},
      emptyGroupLabel
    );

    if (!groups[groupKey]) {
      groups[groupKey] = [];
      sortValues[groupKey] = sortValue;
    }
    groups[groupKey]?.push(item);
  }

  return { groups, sortValues };
}

/**
 * Get relative date group matching Notion's approach
 * Groups dates into: Far past months, Last 30 days, Last 7 days, Yesterday, Today, Tomorrow, Next 7 days, Next 30 days, Far future months
 */
function getRelativeDateGroup(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const diffTime = itemDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Today
  if (diffDays === 0) {
    return "Today";
  }

  // Past dates
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 1) {
      return "Yesterday";
    }
    if (absDays <= 7) {
      return "Last 7 days";
    }
    if (absDays <= 30) {
      return "Last 30 days";
    }
    // Far past: show as "MMM yyyy"
    return date.toLocaleDateString(getUserLocale(), {
      month: "short",
      year: "numeric",
    });
  }

  // Future dates
  if (diffDays === 1) {
    return "Tomorrow";
  }
  if (diffDays <= 7) {
    return "Next 7 days";
  }
  if (diffDays <= 30) {
    return "Next 30 days";
  }
  // Far future: show as "MMM yyyy"
  return date.toLocaleDateString(getUserLocale(), {
    month: "short",
    year: "numeric",
  });
}

/**
 * Get the start of the week for a given date
 * @param date The date to get the week start for
 * @param startWeekOn Whether weeks start on 'monday' or 'sunday' (default: 'sunday')
 */
function getWeekStart(
  date: Date,
  startWeekOn: "monday" | "sunday" = "sunday"
): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.

  if (startWeekOn === "monday") {
    // For Monday start: Monday = 0, Tuesday = 1, ..., Sunday = 6
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
  } else {
    // For Sunday start: Sunday = 0, Monday = 1, ..., Saturday = 6
    d.setDate(d.getDate() - day);
  }

  return d;
}

/**
 * Get the end of the week for a given date
 * @param date The date to get the week end for
 * @param startWeekOn Whether weeks start on 'monday' or 'sunday' (default: 'sunday')
 */
function getWeekEnd(
  date: Date,
  startWeekOn: "monday" | "sunday" = "sunday"
): Date {
  const weekStart = getWeekStart(date, startWeekOn);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
}

/**
 * Format week range as "Nov 4-10, 2024"
 * @param date The date to format
 * @param startWeekOn Whether weeks start on 'monday' or 'sunday' (default: 'sunday')
 */
function formatWeekRange(
  date: Date,
  startWeekOn: "monday" | "sunday" = "sunday"
): string {
  const weekStart = getWeekStart(date, startWeekOn);
  const weekEnd = getWeekEnd(date, startWeekOn);

  const month = weekStart.toLocaleDateString(getUserLocale(), {
    month: "short",
  });
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const year = weekStart.getFullYear();
  const endYear = weekEnd.getFullYear();

  // Check if week spans two years
  if (weekStart.getFullYear() !== weekEnd.getFullYear()) {
    const endMonth = weekEnd.toLocaleDateString(getUserLocale(), {
      month: "short",
    });
    return `${month} ${startDay} ${year}-${endMonth} ${endDay} ${endYear}`;
  }

  // Check if week spans two months
  if (weekStart.getMonth() !== weekEnd.getMonth()) {
    const endMonth = weekEnd.toLocaleDateString(getUserLocale(), {
      month: "short",
    });
    return `${month} ${startDay}-${endMonth} ${endDay} ${year}`;
  }

  return `${month} ${startDay}-${endDay} ${year}`;
}

/**
 * Compute grouped data with various computation functions
 * @param propertyId - Property ID to compute on (references property.id, not data key)
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex switch for different computation types
export function computeData<TData>(
  groupedData: Record<string, TData[]>,
  showAs: ComputationType,
  propertyId?: string,
  properties?: readonly DataViewProperty<TData>[]
): Record<string, number> {
  const result: Record<string, number> = {};

  // Find the property definition for value extraction
  const property = properties?.find((p) => p.id === propertyId);

  // Helper to extract value from item
  const extractValue = (item: TData): unknown => {
    if (!propertyId) {
      return undefined;
    }

    if (property?.type === "formula") {
      // Formula properties can't be used for group counts
      return null;
    }

    // Read from item[propertyId]
    return (item as Record<string, unknown>)[propertyId];
  };

  for (const [groupKey, items] of Object.entries(groupedData)) {
    switch (showAs) {
      case "count":
        result[groupKey] = items.length;
        break;

      case "sum":
        if (!propertyId) {
          break;
        }
        result[groupKey] = items.reduce((sum, item) => {
          const value = Number(extractValue(item)) || 0;
          return sum + value;
        }, 0);
        break;

      case "average": {
        if (!propertyId) {
          break;
        }
        const sum = items.reduce(
          (s, item) => s + (Number(extractValue(item)) || 0),
          0
        );
        result[groupKey] = items.length > 0 ? sum / items.length : 0;
        break;
      }

      case "min": {
        if (!propertyId) {
          break;
        }
        const values = items.map((item) => Number(extractValue(item)) || 0);
        result[groupKey] = values.length > 0 ? Math.min(...values) : 0;
        break;
      }

      case "max": {
        if (!propertyId) {
          break;
        }
        const maxValues = items.map((item) => Number(extractValue(item)) || 0);
        result[groupKey] = maxValues.length > 0 ? Math.max(...maxValues) : 0;
        break;
      }

      case "median": {
        if (!propertyId) {
          break;
        }
        const sorted = items
          .map((item) => Number(extractValue(item)) || 0)
          .sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        if (sorted.length === 0) {
          result[groupKey] = 0;
        } else if (sorted.length % 2 === 0) {
          const upper = sorted[mid] ?? 0;
          const lower = sorted[mid - 1] ?? upper;
          result[groupKey] = (lower + upper) / 2;
        } else {
          result[groupKey] = sorted[mid] !== undefined ? sorted[mid] : 0;
        }
        break;
      }

      case "distinct": {
        if (!propertyId) {
          break;
        }
        const uniqueValues = new Set(
          items.map((item) => String(extractValue(item)))
        );
        result[groupKey] = uniqueValues.size;
        break;
      }

      default:
        result[groupKey] = items.length;
        break;
    }
  }

  return result;
}

export interface ChartDataPoint {
  count?: number;
  name: string;
  percentage?: number;
  sortValue?: string | number; // For proper date/numeric sorting
  value?: number; // Optional when using groupBy
  [key: string]: string | number | undefined; // Allow dynamic keys for grouped data (e.g., { name: "Jan", low: 5, medium: 10, high: 3 })
}

export type SortType =
  | "propertyAscending"
  | "propertyDescending"
  | "countAscending"
  | "countDescending";

/**
 * Transform computed data to chart-ready format
 */
export function transformToChartData(
  computedData: Record<string, number>,
  sortBy?: SortType,
  omitZeroValues?: boolean,
  hideGroups?: string[],
  sortValues?: Record<string, string | number>
): ChartDataPoint[] {
  let chartData = Object.entries(computedData).map(([name, value]) => ({
    name,
    value,
    sortValue: sortValues?.[name],
  }));

  // Filter by hideGroups
  if (hideGroups && hideGroups.length > 0) {
    chartData = chartData.filter((point) => !hideGroups.includes(point.name));
  }

  // Omit zero values if specified
  if (omitZeroValues) {
    chartData = chartData.filter((point) => point.value !== 0);
  }

  // Sort data
  if (sortBy) {
    switch (sortBy) {
      case "propertyAscending":
        // Use sortValue for proper ordering (dates, numbers, etc.), fallback to name
        chartData.sort((a, b) => {
          if (a.sortValue !== undefined && b.sortValue !== undefined) {
            if (
              typeof a.sortValue === "number" &&
              typeof b.sortValue === "number"
            ) {
              return a.sortValue - b.sortValue;
            }
            return String(a.sortValue).localeCompare(String(b.sortValue));
          }
          return a.name.localeCompare(b.name);
        });
        break;
      case "propertyDescending":
        // Reverse sort using sortValue
        chartData.sort((a, b) => {
          if (a.sortValue !== undefined && b.sortValue !== undefined) {
            if (
              typeof a.sortValue === "number" &&
              typeof b.sortValue === "number"
            ) {
              return b.sortValue - a.sortValue;
            }
            return String(b.sortValue).localeCompare(String(a.sortValue));
          }
          return b.name.localeCompare(a.name);
        });
        break;
      case "countAscending":
        // Sort by value ascending (shortest → tallest bars)
        chartData.sort((a, b) => a.value - b.value);
        break;
      case "countDescending":
        // Sort by value descending (tallest → shortest bars)
        chartData.sort((a, b) => b.value - a.value);
        break;
      default:
        break;
    }
  }

  // Calculate percentages for donut charts
  const total = chartData.reduce((sum, point) => sum + point.value, 0);
  chartData = chartData.map((point) => ({
    ...point,
    percentage: total > 0 ? (point.value / total) * 100 : 0,
  }));

  return chartData;
}

/**
 * Compute grouped data with secondary grouping (for stacked/grouped charts)
 * Returns data in format: { xAxisGroup: { secondaryGroup: value, ... }, ... }
 * @param secondaryPropertyId - Property ID for secondary grouping (references property.id, not data key)
 * @param computePropertyId - Property ID to compute on (references property.id, not data key)
 */
export function computeGroupedData<TData>(
  xAxisGroupedData: Record<string, TData[]>,
  secondaryPropertyId: string,
  properties: readonly DataViewProperty<TData>[],
  computationType: ComputationType,
  computePropertyId?: string,
  groupByConfig?: GroupingOptions
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};

  // For each x-axis group, compute values for each secondary group
  for (const [xAxisKey, items] of Object.entries(xAxisGroupedData)) {
    // Group items by the secondary property
    const { groups: secondaryGroups } = groupByProperty(
      items,
      secondaryPropertyId,
      properties,
      groupByConfig
    );

    // Compute values for each secondary group
    const computed = computeData(
      secondaryGroups,
      computationType,
      computePropertyId,
      properties
    );
    result[xAxisKey] = computed;
  }

  return result;
}

/**
 * Get the raw count of items in each group (useful for tooltips)
 */
export function getGroup<TData>(
  groupedData: Record<string, TData[]>
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [key, items] of Object.entries(groupedData)) {
    counts[key] = items.length;
  }
  return counts;
}
