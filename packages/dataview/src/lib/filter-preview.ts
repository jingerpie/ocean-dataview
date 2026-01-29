import type { FilterCondition } from "@ocean-dataview/shared/types";
import { format, parseISO } from "date-fns";

/**
 * Date range value for isBetween condition: [from, to]
 */
type DateRangeValue = [string | null, string | null];

/**
 * Relative date value for isRelativeToToday condition: [direction, count, unit]
 */
type RelativeToTodayValue = [
  "past" | "this" | "next",
  number,
  "day" | "week" | "month" | "year",
];

/**
 * Filter variant determines how conditions are displayed
 */
type FilterVariant =
  | "text"
  | "number"
  | "date"
  | "dateRange"
  | "boolean"
  | "select"
  | "multiSelect";

interface GetFilterPreviewOptions {
  condition: FilterCondition;
  value: unknown;
  variant: FilterVariant;
}

/**
 * Format a date string to short format (e.g., "Jan 22")
 */
function formatDateShort(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, "MMM d");
  } catch {
    return dateStr;
  }
}

/**
 * Format relative date value to display string
 */
function formatRelativeDate(value: RelativeToTodayValue): string {
  const [direction, count, unit] = value;

  // Capitalize for display
  const displayDirection =
    direction.charAt(0).toUpperCase() + direction.slice(1);

  if (direction === "this") {
    return `This ${unit}`;
  }

  const pluralUnit = count === 1 ? unit : `${unit}s`;
  return `${displayDirection} ${count} ${pluralUnit}`;
}

/**
 * Get display text for select value(s)
 * Since SelectOption no longer has label, value is used directly
 */
function getSelectDisplayText(value: unknown): string | null {
  if (!value) {
    return null;
  }

  const values = Array.isArray(value) ? value : [value];
  if (values.length === 0) {
    return null;
  }

  return values.join(", ");
}

/**
 * Get preview for boolean (checkbox) variant
 * Includes ": " prefix
 */
function getBooleanPreview(value: unknown): string {
  if (value === true) {
    return ": Checked";
  }
  if (value === false) {
    return ": Unchecked";
  }
  return "";
}

/**
 * Get preview for number variant
 * Uses operators as separator (space + operator), no colon
 */
function getNumberPreview(condition: FilterCondition, value: unknown): string {
  const numValue = value != null ? String(value) : "";
  switch (condition) {
    case "eq":
      return ` = ${numValue}`;
    case "ne":
      return ` ≠ ${numValue}`;
    case "gt":
      return ` > ${numValue}`;
    case "lt":
      return ` < ${numValue}`;
    case "gte":
      return ` ≥ ${numValue}`;
    case "lte":
      return ` ≤ ${numValue}`;
    default:
      return numValue ? ` = ${numValue}` : "";
  }
}

/**
 * Get preview for date variant
 * Includes ": " prefix
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Date conditions require explicit handling
function getDatePreview(condition: FilterCondition, value: unknown): string {
  if (condition === "isRelativeToToday" && value) {
    return `: ${formatRelativeDate(value as RelativeToTodayValue)}`;
  }

  if (condition === "isBetween" && value) {
    const range = value as DateRangeValue;
    const from = range[0] ? formatDateShort(range[0]) : "?";
    const to = range[1] ? formatDateShort(range[1]) : "?";
    return `: ${from} → ${to}`;
  }

  const dateStr = value ? formatDateShort(value as string) : "";

  switch (condition) {
    case "eq":
      return dateStr ? `: ${dateStr}` : "";
    case "lt":
      return dateStr ? `: Before ${dateStr}` : "";
    case "gt":
      return dateStr ? `: After ${dateStr}` : "";
    case "lte":
      return dateStr ? `: On or before ${dateStr}` : "";
    case "gte":
      return dateStr ? `: On or after ${dateStr}` : "";
    default:
      return dateStr ? `: ${dateStr}` : "";
  }
}

/**
 * Get preview for select variant
 * Includes ": " prefix
 */
function getSelectPreview(condition: FilterCondition, value: unknown): string {
  const displayText = getSelectDisplayText(value);
  if (!displayText) {
    return "";
  }

  switch (condition) {
    case "eq":
    case "inArray":
      return `: ${displayText}`;
    case "ne":
    case "notInArray":
      return `: Not ${displayText}`;
    default:
      return `: ${displayText}`;
  }
}

/**
 * Get preview for multi-select variant
 * Includes ": " prefix
 */
function getMultiSelectPreview(
  condition: FilterCondition,
  value: unknown
): string {
  const displayText = getSelectDisplayText(value);
  if (!displayText) {
    return "";
  }

  switch (condition) {
    case "inArray":
      return `: ${displayText}`;
    case "notInArray":
      return `: Not ${displayText}`;
    default:
      return `: ${displayText}`;
  }
}

/**
 * Get preview for text variant
 * Includes ": " prefix
 */
function getTextPreview(condition: FilterCondition, value: unknown): string {
  const textValue = value != null ? String(value) : "";

  switch (condition) {
    case "eq":
    case "iLike":
      return textValue ? `: ${textValue}` : "";
    case "ne":
    case "notILike":
      return textValue ? `: Not ${textValue}` : "";
    case "startsWith":
      return textValue ? `: Starts with ${textValue}` : "";
    case "endsWith":
      return textValue ? `: Ends with ${textValue}` : "";
    default:
      return textValue ? `: ${textValue}` : "";
  }
}

/**
 * Generate preview string for a filter condition.
 * Returns string with appropriate separator prefix:
 * - ": value" for most conditions
 * - " = value" for number operators (no colon)
 */
export function getFilterPreview({
  condition,
  value,
  variant,
}: GetFilterPreviewOptions): string {
  // Empty conditions - same for all variants, with colon
  if (condition === "isEmpty") {
    return ": Is empty";
  }
  if (condition === "isNotEmpty") {
    return ": Is not empty";
  }

  switch (variant) {
    case "boolean":
      return getBooleanPreview(value);
    case "number":
      return getNumberPreview(condition, value);
    case "date":
    case "dateRange":
      return getDatePreview(condition, value);
    case "select":
      return getSelectPreview(condition, value);
    case "multiSelect":
      return getMultiSelectPreview(condition, value);
    default:
      return getTextPreview(condition, value);
  }
}
