import type { WhereNode, WhereRule } from "@sparkyidea/shared/types";
import type { GroupByConfigInput } from "@sparkyidea/shared/utils/parsers/group";

// Regex patterns for parsing number range group keys
const LESS_THAN_REGEX = /^< (\d+)$/;
const PLUS_REGEX = /^(\d+)\+$/;
const RANGE_REGEX = /^(\d+)-(\d+)$/;

/**
 * Extracts the property name from a GroupByConfigInput.
 */
export function getGroupProperty(
  group: GroupByConfigInput | null
): string | null {
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

  // For number groups, parse range formats (e.g., "0-100", "< 100", "500+")
  const groupRule: WhereRule =
    "byNumber" in group
      ? parseNumberRangeFilter(property, groupKey)
      : { property, condition: "eq", value: groupKey };

  if (!userFilter || userFilter.length === 0) {
    return [groupRule];
  }

  return [groupRule, ...userFilter];
}
