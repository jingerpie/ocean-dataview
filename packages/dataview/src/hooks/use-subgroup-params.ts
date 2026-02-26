"use client";

import {
  type GroupByConfigInput,
  type GroupConfigInput,
  parseAsGroupBy,
} from "@sparkyidea/shared/utils/parsers/group";
import { parseAsExpanded } from "@sparkyidea/shared/utils/parsers/pagination";
import { useQueryState } from "nuqs";
import { useCallback } from "react";

const THROTTLE_MS = 50;

/**
 * Hook for managing sub-group configuration via URL.
 *
 * Uses URL as source of truth with shallow: true (default).
 * All actions update URL immediately (no debouncing needed).
 *
 * Sub-group is only used in board views:
 * - Group = columns (primary grouping)
 * - SubGroup = rows (secondary grouping)
 *
 * When subGroup property or type changes, expanded groups are automatically
 * cleared since old group keys are no longer valid.
 *
 * @example
 * ```ts
 * const { subGroup, setSubGroup, clearSubGroup } = useSubGroupParams();
 * ```
 */
export function useSubGroupParams() {
  // URL state - source of truth
  const [subGroup, setUrlSubGroup] = useQueryState(
    "subGroup",
    parseAsGroupBy.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [, setUrlExpanded] = useQueryState(
    "expanded",
    parseAsExpanded.withOptions({ throttleMs: THROTTLE_MS })
  );

  // Set subGroup configuration (replaces entire config)
  const setSubGroup = useCallback(
    (newSubGroup: GroupByConfigInput | null) => {
      if (!newSubGroup) {
        void setUrlSubGroup(null);
        void setUrlExpanded(null);
        return;
      }

      // Preserve existing sort/hideEmpty when changing subGroup type
      const config: GroupConfigInput = {
        ...newSubGroup,
        sort: subGroup?.sort,
        hideEmpty: subGroup?.hideEmpty,
      };

      void setUrlSubGroup(config);
      // Clear expanded - old group keys are no longer valid
      void setUrlExpanded(null);
    },
    [subGroup, setUrlSubGroup, setUrlExpanded]
  );

  // Clear subGroup (remove subGrouping)
  const clearSubGroup = useCallback(() => {
    void setUrlSubGroup(null);
    void setUrlExpanded(null);
  }, [setUrlSubGroup, setUrlExpanded]);

  // Set sort order
  const setSubGroupSortOrder = useCallback(
    (sort: "asc" | "desc") => {
      if (!subGroup) {
        return;
      }
      void setUrlSubGroup({ ...subGroup, sort });
    },
    [subGroup, setUrlSubGroup]
  );

  // Set hide empty groups
  const setHideEmptySubGroups = useCallback(
    (hideEmpty: boolean) => {
      if (!subGroup) {
        return;
      }
      void setUrlSubGroup({ ...subGroup, hideEmpty });
    },
    [subGroup, setUrlSubGroup]
  );

  // Extract property from subGroup config
  const subGroupProperty = (() => {
    if (!subGroup) {
      return null;
    }
    if ("bySelect" in subGroup) {
      return subGroup.bySelect.property;
    }
    if ("byStatus" in subGroup) {
      return subGroup.byStatus.property;
    }
    if ("byDate" in subGroup) {
      return subGroup.byDate.property;
    }
    if ("byCheckbox" in subGroup) {
      return subGroup.byCheckbox.property;
    }
    if ("byMultiSelect" in subGroup) {
      return subGroup.byMultiSelect.property;
    }
    if ("byText" in subGroup) {
      return subGroup.byText.property;
    }
    if ("byNumber" in subGroup) {
      return subGroup.byNumber.property;
    }
    return null;
  })();

  // Extract subGroup type from config
  const subGroupType = (() => {
    if (!subGroup) {
      return null;
    }
    if ("bySelect" in subGroup) {
      return "select";
    }
    if ("byStatus" in subGroup) {
      return "status";
    }
    if ("byDate" in subGroup) {
      return "date";
    }
    if ("byCheckbox" in subGroup) {
      return "checkbox";
    }
    if ("byMultiSelect" in subGroup) {
      return "multiSelect";
    }
    if ("byText" in subGroup) {
      return "text";
    }
    if ("byNumber" in subGroup) {
      return "number";
    }
    return null;
  })();

  return {
    subGroup,
    setSubGroup,
    clearSubGroup,
    subGroupProperty,
    subGroupType,
    isSubGrouped: subGroup !== null,
    subGroupSortOrder: subGroup?.sort ?? "asc",
    setSubGroupSortOrder,
    hideEmptySubGroups: subGroup?.hideEmpty ?? false,
    setHideEmptySubGroups,
  };
}
