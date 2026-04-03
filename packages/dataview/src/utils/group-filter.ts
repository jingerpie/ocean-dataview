import type { WhereNode, WhereRule } from "../types/filter.type";
import type { GroupByConfig } from "../types/group.type";

const LESS_THAN_REGEX = /^< (-?\d+(?:\.\d+)?)$/;
const PLUS_REGEX = /^(-?\d+(?:\.\d+)?)\+$/;
const RANGE_REGEX = /^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/;
const SINGLE_LETTER_REGEX = /^[A-Z]$/;

function parseTextAlphabeticalFilter(
  property: string,
  groupKey: string
): WhereRule {
  if (groupKey === "#") {
    return { property, condition: "startsWithNonAlpha", value: true };
  }
  if (SINGLE_LETTER_REGEX.test(groupKey)) {
    return { property, condition: "startsWith", value: groupKey };
  }
  return { property, condition: "eq", value: groupKey };
}

function parseNumberRangeFilter(property: string, groupKey: string): WhereRule {
  const lessThanMatch = LESS_THAN_REGEX.exec(groupKey);
  if (lessThanMatch) {
    return { property, condition: "lt", value: Number(lessThanMatch[1]) };
  }

  const plusMatch = PLUS_REGEX.exec(groupKey);
  if (plusMatch) {
    return { property, condition: "gte", value: Number(plusMatch[1]) };
  }

  const rangeMatch = RANGE_REGEX.exec(groupKey);
  if (rangeMatch) {
    return {
      property,
      condition: "isBetween",
      value: [Number(rangeMatch[1]), Number(rangeMatch[2])],
    };
  }

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
 */
export function combineGroupFilter(
  group: GroupByConfig | null,
  groupKey: string,
  userFilter: WhereNode[] | null
): WhereNode[] {
  if (groupKey === "__ungrouped__" || !group) {
    return userFilter ?? [];
  }

  const property = group.propertyId;
  if (!property) {
    return userFilter ?? [];
  }

  let groupRule: WhereRule;

  switch (group.propertyType) {
    case "checkbox":
      groupRule = { property, condition: "eq", value: groupKey === "true" };
      break;
    case "number":
      groupRule = parseNumberRangeFilter(property, groupKey);
      break;
    case "text":
      if (group.showAs === "alphabetical") {
        groupRule = parseTextAlphabeticalFilter(property, groupKey);
      } else {
        groupRule = { property, condition: "eq", value: groupKey };
      }
      break;
    default:
      groupRule = { property, condition: "eq", value: groupKey };
  }

  if (!userFilter || userFilter.length === 0) {
    return [groupRule];
  }

  return [groupRule, ...userFilter];
}
