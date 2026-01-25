import type { WhereNode, WhereRule } from "../types";

/**
 * Combines a group filter with an optional user filter.
 * Used in grouped views where each group needs its own query.
 */
export function combineGroupFilter(
  groupProperty: string,
  groupKey: string,
  userFilter: WhereNode | null
): WhereNode {
  const groupRule: WhereRule = {
    property: groupProperty,
    condition: "eq",
    value: groupKey,
  };

  if (!userFilter) {
    return { and: [groupRule] };
  }

  return { and: [groupRule, userFilter] };
}
