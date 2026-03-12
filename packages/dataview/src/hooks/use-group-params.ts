"use client";

import { useCallback } from "react";
import {
  useQueryParamsActions,
  useQueryParamsState,
} from "../lib/providers/query-params-context";
import type { GroupByConfig, GroupConfigInput } from "../types";

/**
 * Hook for managing group configuration via URL.
 *
 * Reads from QueryParamsContext (single source of truth for validated state).
 *
 * When group property or type changes, expanded groups are automatically
 * cleared since old group keys are no longer valid.
 *
 * @example
 * ```ts
 * const { group, setGroup, clearGroup } = useGroupParams();
 * ```
 */
export function useGroupParams() {
  const { group } = useQueryParamsState();
  const { setGroup: setGroupBase } = useQueryParamsActions();

  // Set group configuration (replaces entire config)
  const setGroup = useCallback(
    (newGroup: GroupByConfig | null) => {
      if (!newGroup) {
        setGroupBase(null);
        return;
      }

      // Preserve existing sort/hideEmpty when changing group type
      const config: GroupConfigInput = {
        ...newGroup,
        sort: group?.sort,
        hideEmpty: group?.hideEmpty,
      };

      setGroupBase(config);
    },
    [group, setGroupBase]
  );

  // Clear group (remove grouping)
  const clearGroup = useCallback(() => {
    setGroupBase(null);
  }, [setGroupBase]);

  // Set sort order
  const setGroupSortOrder = useCallback(
    (sort: "asc" | "desc") => {
      if (!group) {
        return;
      }
      setGroupBase({ ...group, sort });
    },
    [group, setGroupBase]
  );

  // Set hide empty groups
  const setHideEmptyGroups = useCallback(
    (hideEmpty: boolean) => {
      if (!group) {
        return;
      }
      setGroupBase({ ...group, hideEmpty });
    },
    [group, setGroupBase]
  );

  // Extract property from group config using canonical propertyId field
  const groupProperty = group?.propertyId ?? null;

  // Extract group type from config using canonical propertyType field
  const groupType = group?.propertyType ?? null;

  // Get sort order (defaults to "asc")
  const groupSortOrder = group?.sort ?? "asc";

  return {
    group,
    setGroup,
    clearGroup,
    groupProperty,
    groupType,
    isGrouped: group !== null,
    groupSortOrder,
    setGroupSortOrder,
    hideEmptyGroups: group?.hideEmpty ?? false,
    setHideEmptyGroups,
  };
}
