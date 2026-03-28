import type {
  GroupByConfig,
  WhereNode,
  WhereRule,
} from "@sparkyidea/dataview/types";

// Regex patterns for parsing number range group keys
// Supports negative numbers and decimals (e.g., "< -10", "-5.5+", "-10-0", "1.5-2.5")
const LESS_THAN_REGEX = /^< (-?\d+(?:\.\d+)?)$/;
const PLUS_REGEX = /^(-?\d+(?:\.\d+)?)\+$/;
// Range regex: handles "min-max" including negative ranges like "-10-0" or "-10--5"
// Uses lookbehind to distinguish range separator from negative sign
const RANGE_REGEX = /^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/;

// Regex for matching single uppercase letter (A-Z)
const SINGLE_LETTER_REGEX = /^[A-Z]$/;

/**
 * Parse a text alphabetical group key into filter rule.
 * Handles single letters (A-Z) and "#" for non-alphabetic.
 */
function parseTextAlphabeticalFilter(
  property: string,
  groupKey: string
): WhereRule {
  // "#" group: non-alphabetic first character (empty, null, or starts with non-letter)
  if (groupKey === "#") {
    return { property, condition: "startsWithNonAlpha", value: true };
  }

  // Single letter (A-Z): use startsWith (case-insensitive via ILIKE on server)
  if (SINGLE_LETTER_REGEX.test(groupKey)) {
    return { property, condition: "startsWith", value: groupKey };
  }

  // Fallback to exact match
  return { property, condition: "eq", value: groupKey };
}

/**
 * Parse a number range group key into filter rule.
 * Handles formats: "0-100", "< 100", "500+"
 */
function parseNumberRangeFilter(property: string, groupKey: string): WhereRule {
  // Handle "< min" format
  const lessThanMatch = LESS_THAN_REGEX.exec(groupKey);
  if (lessThanMatch) {
    return { property, condition: "lt", value: Number(lessThanMatch[1]) };
  }

  // Handle "max+" format
  const plusMatch = PLUS_REGEX.exec(groupKey);
  if (plusMatch) {
    return { property, condition: "gte", value: Number(plusMatch[1]) };
  }

  // Handle "min-max" range format
  const rangeMatch = RANGE_REGEX.exec(groupKey);
  if (rangeMatch) {
    return {
      property,
      condition: "isBetween",
      value: [Number(rangeMatch[1]), Number(rangeMatch[2])],
    };
  }

  // Fallback: exact number match (parse as number if valid)
  const numValue = Number(groupKey);
  return {
    property,
    condition: "eq",
    value: Number.isNaN(numValue) ? groupKey : numValue,
  };
}

/**
 * Combines a group filter with an optional user filter array.
 * Used in grouped views where each group needs its own query.
 *
 * @param group - The group configuration (determines property and type)
 * @param groupKey - The group key value ("__ungrouped__" for flat views)
 * @param userFilter - Optional existing user filters
 * @returns Array of WhereNodes for use with buildWhere
 */
export function combineGroupFilter(
  group: GroupByConfig | null,
  groupKey: string,
  userFilter: WhereNode[] | null
): WhereNode[] {
  // __ungrouped__ means flat view - no group filter needed
  if (groupKey === "__ungrouped__" || !group) {
    return userFilter ?? [];
  }

  const property = group.propertyId;
  if (!property) {
    return userFilter ?? [];
  }

  // Build group rule based on group type using canonical propertyType
  let groupRule: WhereRule;

  switch (group.propertyType) {
    case "checkbox":
      // Checkbox groups: "true" → true, "false" → false
      groupRule = { property, condition: "eq", value: groupKey === "true" };
      break;
    case "number":
      // Number groups: parse range formats (e.g., "0-100", "< 100", "500+")
      groupRule = parseNumberRangeFilter(property, groupKey);
      break;
    case "text":
      // Text alphabetical groups: parse letter or "#" for non-alphabetic
      if (group.showAs === "alphabetical") {
        groupRule = parseTextAlphabeticalFilter(property, groupKey);
      } else {
        // Exact text match
        groupRule = { property, condition: "eq", value: groupKey };
      }
      break;
    default:
      // Default: exact match (select, status, multiSelect, date)
      groupRule = { property, condition: "eq", value: groupKey };
  }

  if (!userFilter || userFilter.length === 0) {
    return [groupRule];
  }

  return [groupRule, ...userFilter];
}
