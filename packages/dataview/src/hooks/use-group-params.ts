"use client";

import type { GroupByConfig, GroupConfigInput } from "@sparkyidea/shared/types";
import { parseAsGroupBy } from "@sparkyidea/shared/utils/parsers/group";
import { parseAsExpanded } from "@sparkyidea/shared/utils/parsers/pagination";
import { useQueryState } from "nuqs";
import { useCallback } from "react";

const THROTTLE_MS = 50;

/**
 * Hook for managing group configuration via URL.
 *
 * Uses URL as source of truth with shallow: true (default).
 * All actions update URL immediately (no debouncing needed).
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
  // URL state - source of truth
  const [group, setUrlGroup] = useQueryState(
    "group",
    parseAsGroupBy.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [, setUrlExpanded] = useQueryState(
    "expanded",
    parseAsExpanded.withOptions({ throttleMs: THROTTLE_MS })
  );

  // Set group configuration (replaces entire config)
  const setGroup = useCallback(
    (newGroup: GroupByConfig | null) => {
      if (!newGroup) {
        void setUrlGroup(null);
        void setUrlExpanded(null);
        return;
      }

      // Preserve existing sort/hideEmpty when changing group type
      const config: GroupConfigInput = {
        ...newGroup,
        sort: group?.sort,
        hideEmpty: group?.hideEmpty,
      };

      void setUrlGroup(config);
      // Clear expanded - old group keys are no longer valid
      void setUrlExpanded(null);
    },
    [group, setUrlGroup, setUrlExpanded]
  );

  // Clear group (remove grouping)
  const clearGroup = useCallback(() => {
    void setUrlGroup(null);
    void setUrlExpanded(null);
  }, [setUrlGroup, setUrlExpanded]);

  // Set sort order
  const setGroupSortOrder = useCallback(
    (sort: "asc" | "desc") => {
      if (!group) {
        return;
      }
      void setUrlGroup({ ...group, sort });
    },
    [group, setUrlGroup]
  );

  // Set hide empty groups
  const setHideEmptyGroups = useCallback(
    (hideEmpty: boolean) => {
      if (!group) {
        return;
      }
      void setUrlGroup({ ...group, hideEmpty });
    },
    [group, setUrlGroup]
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
