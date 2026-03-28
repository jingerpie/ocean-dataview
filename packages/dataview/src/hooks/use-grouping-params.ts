"use client";

import type { GroupByConfig, GroupConfigInput } from "../types/group.type";
import { useColumnParams } from "./use-column-params";
import { useGroupParams } from "./use-group-params";

export type GroupingMode = "group" | "column";

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
  /** Set the grouping config (base config without options) */
  setConfig: (config: GroupByConfig | null) => void;
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
 * Unified hook for managing group or column params.
 *
 * This hook normalizes the API between useGroupParams and useColumnParams,
 * allowing UI components to work with any mode without code duplication.
 *
 * @param mode - "group" for accordion grouping (all views), "column" for board columns
 * @returns Normalized grouping parameters
 *
 * @example
 * ```ts
 * // For group (accordion - all views)
 * const params = useGroupingParams("group");
 *
 * // For column (board columns)
 * const params = useGroupingParams("column");
 * ```
 */
export function useGroupingParams(mode: GroupingMode): GroupingParams {
  const groupParams = useGroupParams();
  const columnParams = useColumnParams();

  if (mode === "column") {
    return {
      config: columnParams.column,
      property: columnParams.columnProperty,
      type: columnParams.columnType,
      isGrouped: columnParams.hasColumn,
      sortOrder: columnParams.columnSortOrder,
      hideEmpty: columnParams.hideEmptyColumns,
      setConfig: columnParams.setColumn,
      clearConfig: columnParams.clearColumn,
      setSortOrder: columnParams.setColumnSortOrder,
      setHideEmpty: columnParams.setHideEmptyColumns,
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
