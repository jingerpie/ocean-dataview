import type { WhereNode, WhereRule } from "@sparkyidea/shared/types";
import type { GroupByConfigInput } from "@sparkyidea/shared/utils/parsers/group";

// Regex patterns for parsing number range group keys
const LESS_THAN_REGEX = /^< (\d+)$/;
const PLUS_REGEX = /^(\d+)\+$/;
const RANGE_REGEX = /^(\d+)-(\d+)$/;

// Regex for matching single uppercase letter (A-Z)
const SINGLE_LETTER_REGEX = /^[A-Z]$/;

/**
 * Extracts the property name from a GroupByConfigInput.
 */
function getGroupProperty(group: GroupByConfigInput | null): string | null {
  if (!group) {
    return null;
  }
  if ("bySelect" in group) {
    return group.bySelect.property;
  }
  if ("byStatus" in group) {
    return group.byStatus.property;
  }
  if ("byDate" in group) {
    return group.byDate.property;
  }
  if ("byCheckbox" in group) {
    return group.byCheckbox.property;
  }
  if ("byMultiSelect" in group) {
    return group.byMultiSelect.property;
  }
  if ("byText" in group) {
    return group.byText.property;
  }
  if ("byNumber" in group) {
    return group.byNumber.property;
  }
  return null;
}

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

  // Fallback: exact number match
  return { property, condition: "eq", value: groupKey };
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
  group: GroupByConfigInput | null,
  groupKey: string,
  userFilter: WhereNode[] | null
): WhereNode[] {
  // __ungrouped__ means flat view - no group filter needed
  if (groupKey === "__ungrouped__" || !group) {
    return userFilter ?? [];
  }

  const property = getGroupProperty(group);
  if (!property) {
    return userFilter ?? [];
  }

  // Build group rule based on group type
  let groupRule: WhereRule;

  if ("byCheckbox" in group) {
    // Checkbox groups: "true" → true, "false" → false
    groupRule = { property, condition: "eq", value: groupKey === "true" };
  } else if ("byNumber" in group) {
    // Number groups: parse range formats (e.g., "0-100", "< 100", "500+")
    groupRule = parseNumberRangeFilter(property, groupKey);
  } else if ("byText" in group && group.byText.showAs === "alphabetical") {
    // Text alphabetical groups: parse letter or "#" for non-alphabetic
    groupRule = parseTextAlphabeticalFilter(property, groupKey);
  } else {
    // Default: exact match
    groupRule = { property, condition: "eq", value: groupKey };
  }

  if (!userFilter || userFilter.length === 0) {
    return [groupRule];
  }

  return [groupRule, ...userFilter];
}
