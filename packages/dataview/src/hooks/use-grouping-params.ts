"use client";

import type {
  GroupByConfigInput,
  GroupConfigInput,
} from "@sparkyidea/shared/utils/parsers/group";
import { useGroupParams } from "./use-group-params";
import { useSubGroupParams } from "./use-subgroup-params";

export type GroupingMode = "group" | "subGroup";

export interface GroupingParams {
  /** Clear the grouping */
  clearConfig: () => void;
  /** Current grouping config */
  config: GroupConfigInput | null;
  /** Whether to hide empty groups */
  hideEmpty: boolean;
  /** Whether grouping is active */
  isGrouped: boolean;
  /** Property being grouped by */
  property: string | null;
  /** Set the grouping config */
  setConfig: (config: GroupByConfigInput | null) => void;
  /** Set hide empty groups */
  setHideEmpty: (hide: boolean) => void;
  /** Set the sort order */
  setSortOrder: (order: "asc" | "desc") => void;
  /** Sort order */
  sortOrder: "asc" | "desc";
  /** Type of grouping (select, status, date, etc.) */
  type: string | null;
}

/**
 * Unified hook for managing either group or subGroup params.
 *
 * This hook normalizes the API between useGroupParams and useSubGroupParams,
 * allowing UI components to work with either mode without code duplication.
 *
 * @param mode - "group" for primary grouping, "subGroup" for secondary grouping (board rows)
 * @returns Normalized grouping parameters
 *
 * @example
 * ```ts
 * // For group (default)
 * const params = useGroupingParams("group");
 *
 * // For subGroup (board rows)
 * const params = useGroupingParams("subGroup");
 * ```
 */
export function useGroupingParams(mode: GroupingMode): GroupingParams {
  const groupParams = useGroupParams();
  const subGroupParams = useSubGroupParams();

  if (mode === "subGroup") {
    return {
      config: subGroupParams.subGroup,
      property: subGroupParams.subGroupProperty,
      type: subGroupParams.subGroupType,
      isGrouped: subGroupParams.isSubGrouped,
      sortOrder: subGroupParams.subGroupSortOrder,
      hideEmpty: subGroupParams.hideEmptySubGroups,
      setConfig: subGroupParams.setSubGroup,
      clearConfig: subGroupParams.clearSubGroup,
      setSortOrder: subGroupParams.setSubGroupSortOrder,
      setHideEmpty: subGroupParams.setHideEmptySubGroups,
    };
  }

  return {
    config: groupParams.group,
    property: groupParams.groupProperty,
    type: groupParams.groupType,
    isGrouped: groupParams.isGrouped,
    sortOrder: groupParams.groupSortOrder,
    hideEmpty: groupParams.hideEmptyGroups,
    setConfig: groupParams.setGroup,
    clearConfig: groupParams.clearGroup,
    setSortOrder: groupParams.setGroupSortOrder,
    setHideEmpty: groupParams.setHideEmptyGroups,
  };
}
