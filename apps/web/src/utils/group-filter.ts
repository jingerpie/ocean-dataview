import type { WhereNode, WhereRule } from "@sparkyidea/shared/types";
import type { GroupByConfigInput } from "@sparkyidea/shared/utils/parsers/group";

/**
 * Extracts the property name from a GroupByConfigInput.
 *
 * @param group - The group configuration
 * @returns The property name or null if invalid
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
 * Combines a group filter with an optional user filter array.
 * Used in grouped views where each group needs its own query.
 *
 * @returns Array of WhereNodes for use with buildWhere
 */
export function combineGroupFilter(
  groupProperty: string,
  groupKey: string,
  userFilter: WhereNode[] | null
): WhereNode[] {
  const groupRule: WhereRule = {
    property: groupProperty,
    condition: "eq",
    value: groupKey,
  };

  if (!userFilter || userFilter.length === 0) {
    return [groupRule];
  }

  return [groupRule, ...userFilter];
}
