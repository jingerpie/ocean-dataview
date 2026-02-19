import type { ParsedGroupConfig } from "@sparkyidea/shared/types";

interface GroupResult {
  groupKey: string;
  sortValue: string | number;
}

interface GroupedResult<T> {
  groups: Record<string, T[]>;
  sortValues: Record<string, string | number>;
}

/** Regex for matching uppercase A-Z letters */
const UPPERCASE_LETTER_REGEX = /[A-Z]/;

/**
 * Get relative date group matching Notion's approach
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

  if (diffDays === 0) {
    return "Today";
  }

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
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

  if (diffDays === 1) {
    return "Tomorrow";
  }
  if (diffDays <= 7) {
    return "Next 7 days";
  }
  if (diffDays <= 30) {
    return "Next 30 days";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

/**
 * Get the start of the week for a given date
 */
function getWeekStart(
  date: Date,
  startWeekOn: "monday" | "sunday" = "sunday"
): Date {
  const d = new Date(date);
  const day = d.getDay();

  if (startWeekOn === "monday") {
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
  } else {
    d.setDate(d.getDate() - day);
  }

  return d;
}

/**
 * Get the end of the week for a given date
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
 */
function formatWeekRange(
  date: Date,
  startWeekOn: "monday" | "sunday" = "sunday"
): string {
  const weekStart = getWeekStart(date, startWeekOn);
  const weekEnd = getWeekEnd(date, startWeekOn);

  const month = weekStart.toLocaleDateString("en-US", { month: "short" });
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const year = weekStart.getFullYear();
  const endYear = weekEnd.getFullYear();

  if (weekStart.getFullYear() !== weekEnd.getFullYear()) {
    const endMonth = weekEnd.toLocaleDateString("en-US", { month: "short" });
    return `${month} ${startDay} ${year}-${endMonth} ${endDay} ${endYear}`;
  }

  if (weekStart.getMonth() !== weekEnd.getMonth()) {
    const endMonth = weekEnd.toLocaleDateString("en-US", { month: "short" });
    return `${month} ${startDay}-${endMonth} ${endDay} ${year}`;
  }

  return `${month} ${startDay}-${endDay} ${year}`;
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
        groupKey: date.toLocaleDateString("en-US", {
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
        groupKey: date.toLocaleDateString("en-US", {
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

// Status config structure
interface StatusConfig {
  groups?: Array<{ label: string; color: string; options: string[] }>;
}

/**
 * Handle status property grouping by group (using group labels)
 */
function handleStatusGroupGrouping(
  value: unknown,
  config?: StatusConfig,
  emptyLabel?: string
): GroupResult {
  const statusValue = String(value);

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
  config?: StatusConfig,
  emptyLabel?: string
): GroupResult {
  const statusValue = String(value);

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
    return { groupKey: "#", sortValue: "~" };
  }

  const firstChar = text.charAt(0).toUpperCase();

  if (UPPERCASE_LETTER_REGEX.test(firstChar)) {
    return { groupKey: firstChar, sortValue: firstChar };
  }

  return { groupKey: "#", sortValue: "~" };
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

  if (num < min) {
    return { groupKey: `< ${min}`, sortValue: min - 1 };
  }

  if (num >= max) {
    return { groupKey: `${max}+`, sortValue: max };
  }

  const bucketIndex = Math.floor((num - min) / step);
  const bucketStart = bucketIndex * step + min;
  const bucketEnd = bucketStart + step;

  return {
    groupKey: `${bucketStart}-${bucketEnd}`,
    sortValue: bucketStart,
  };
}

interface PropertyConfig {
  config?: StatusConfig;
  type:
    | "select"
    | "multiSelect"
    | "status"
    | "checkbox"
    | "date"
    | "text"
    | "number";
}

/**
 * Get group key and sort value for a data item
 */
function getGroupKeyAndSortValue(
  value: unknown,
  property: PropertyConfig | undefined,
  parsed: ParsedGroupConfig,
  emptyGroupLabel: string
): GroupResult {
  const { showAs, startWeekOn, textShowAs, numberRange } = parsed;

  // Handle null/undefined values
  if (value === null || value === undefined) {
    return { groupKey: emptyGroupLabel, sortValue: Number.MAX_SAFE_INTEGER };
  }

  // Handle date grouping
  if (
    parsed.propertyType === "date" &&
    showAs &&
    showAs !== "group" &&
    showAs !== "option"
  ) {
    return handleDateGrouping(
      value,
      showAs as "day" | "week" | "month" | "year" | "relative",
      startWeekOn
    );
  }

  // Handle status grouping by group
  if (parsed.propertyType === "status" && showAs === "group") {
    return handleStatusGroupGrouping(value, property?.config, emptyGroupLabel);
  }

  // Handle status grouping by option
  if (parsed.propertyType === "status") {
    return handleStatusOptionGrouping(value, property?.config, emptyGroupLabel);
  }

  // Handle text alphabetical grouping
  if (parsed.propertyType === "text" && textShowAs === "alphabetical") {
    return handleTextAlphabeticalGrouping(value);
  }

  // Handle number range grouping
  if (parsed.propertyType === "number" && numberRange) {
    return handleNumberRangeGrouping(value, numberRange);
  }

  // Handle checkbox grouping
  if (parsed.propertyType === "checkbox") {
    const boolValue = Boolean(value);
    return {
      groupKey: boolValue ? "Checked" : "Unchecked",
      sortValue: boolValue ? 0 : 1,
    };
  }

  // Default grouping (select, multiSelect, text exact)
  return {
    groupKey: String(value),
    sortValue: String(value),
  };
}

/**
 * Group items by property with grouping transformations
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Grouping logic requires handling many property types
export function groupItems<T extends Record<string, unknown>>(
  items: T[],
  parsed: ParsedGroupConfig,
  propertyConfig?: PropertyConfig
): GroupedResult<T> {
  const { property } = parsed;
  const emptyGroupLabel = `No ${property}`;
  const groups: Record<string, T[]> = {};
  const sortValues: Record<string, string | number> = {};

  for (const item of items) {
    const value = item[property];

    // Handle multiSelect (array values)
    if (parsed.propertyType === "multiSelect" && Array.isArray(value)) {
      if (value.length === 0) {
        const groupKey = emptyGroupLabel;
        if (!groups[groupKey]) {
          groups[groupKey] = [];
          sortValues[groupKey] = Number.MAX_SAFE_INTEGER;
        }
        groups[groupKey].push(item);
      } else {
        // Item appears in each selected option's group
        for (const v of value) {
          const groupKey = String(v);
          if (!groups[groupKey]) {
            groups[groupKey] = [];
            sortValues[groupKey] = groupKey;
          }
          groups[groupKey].push(item);
        }
      }
      continue;
    }

    const { groupKey, sortValue } = getGroupKeyAndSortValue(
      value,
      propertyConfig,
      parsed,
      emptyGroupLabel
    );

    if (!groups[groupKey]) {
      groups[groupKey] = [];
      sortValues[groupKey] = sortValue;
    }
    groups[groupKey].push(item);
  }

  return { groups, sortValues };
}

/**
 * Build group counts from grouped items
 */
export function buildGroupCounts<T>(
  grouped: GroupedResult<T>,
  maxCount = 100
): {
  counts: Record<string, { count: number; hasMore: boolean }>;
  sortValues: Record<string, string | number>;
} {
  const counts: Record<string, { count: number; hasMore: boolean }> = {};

  for (const [key, items] of Object.entries(grouped.groups)) {
    counts[key] = {
      count: Math.min(items.length, maxCount),
      hasMore: items.length > maxCount,
    };
  }

  return {
    counts,
    sortValues: grouped.sortValues,
  };
}
