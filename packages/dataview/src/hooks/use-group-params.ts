"use client";

import {
  type GroupByConfigInput,
  type GroupConfigInput,
  parseAsGroupBy,
} from "@sparkyidea/shared/utils/parsers/group";
import { parseAsExpanded } from "@sparkyidea/shared/utils/parsers/pagination";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDataViewContext } from "../lib/providers";

/**
 * Hook for managing group configuration via URL.
 *
 * Group settings stored in URL:
 * - Group config (byTYPE, property, showAs, etc.)
 * - Sort order (asc/desc)
 * - Hide empty groups
 *
 * Note: `expanded` is a view-level concern (separate URL param),
 * managed by pagination hooks, since different views expand different levels:
 * - Board: expands subGroup rows
 * - Table/List/Gallery: expands group rows
 *
 * When group property or type changes, expanded groups are automatically cleared
 * since old group keys are no longer valid.
 *
 * @example
 * ```ts
 * const { group, setGroup, clearGroup } = useGroupParams();
 * ```
 */
export function useGroupParams() {
  // Read group from context (server props)
  const { group: contextGroup } = useDataViewContext();
  const serverGroup = (contextGroup as GroupConfigInput | undefined) ?? null;

  // URL state (nuqs handles URL updates)
  const [, setUrlGroupState] = useQueryState(
    "group",
    parseAsGroupBy.withOptions({ shallow: false })
  );

  // Expanded URL state - cleared when group changes
  const [, setUrlExpandedState] = useQueryState(
    "expanded",
    parseAsExpanded.withOptions({ shallow: false })
  );

  // Local state for immediate UI updates (initialized from server)
  const [localGroup, setLocalGroup] = useState<GroupConfigInput | null>(
    serverGroup
  );

  // Track if change originated internally
  const isInternalChange = useRef(false);

  // Sync local state when server value changes (navigation, refresh)
  // Skip sync if we triggered the change ourselves
  useEffect(() => {
    if (!isInternalChange.current) {
      setLocalGroup(serverGroup);
    }
    isInternalChange.current = false;
  }, [serverGroup]);

  // Helper to update the group config
  const updateGroup = useCallback(
    (updater: (prev: GroupConfigInput | null) => GroupConfigInput | null) => {
      // Use functional update to get the new value, then update URL separately
      let nextValue: GroupConfigInput | null = null;
      setLocalGroup((prev) => {
        nextValue = updater(prev);
        return nextValue;
      });
      // Update URL after state update (not inside the updater)
      isInternalChange.current = true;
      void setUrlGroupState(nextValue);
    },
    [setUrlGroupState]
  );

  // Set the group configuration (replaces entire config)
  // Clears expanded groups when group property or type changes
  const setGroup = useCallback(
    (newGroup: GroupByConfigInput | null) => {
      if (!newGroup) {
        updateGroup(() => null);
        // Clear expanded when removing grouping
        void setUrlExpandedState(null);
        return;
      }
      // Preserve existing sort/hideEmpty when changing group type
      updateGroup((prev) => ({
        ...newGroup,
        sort: prev?.sort,
        hideEmpty: prev?.hideEmpty,
      }));
      // Clear expanded groups since old group keys are no longer valid
      void setUrlExpandedState(null);
    },
    [updateGroup, setUrlExpandedState]
  );

  // Clear group (remove grouping)
  const clearGroup = useCallback(() => {
    updateGroup(() => null);
    // Clear expanded when removing grouping
    void setUrlExpandedState(null);
  }, [updateGroup, setUrlExpandedState]);

  // Set sort order
  const setGroupSortOrder = useCallback(
    (sort: "asc" | "desc") => {
      updateGroup((prev) => {
        if (!prev) {
          return null;
        }
        return { ...prev, sort };
      });
    },
    [updateGroup]
  );

  // Set hide empty groups
  const setHideEmptyGroups = useCallback(
    (hideEmpty: boolean) => {
      updateGroup((prev) => {
        if (!prev) {
          return null;
        }
        return { ...prev, hideEmpty };
      });
    },
    [updateGroup]
  );

  // Extract property from group config
  const groupProperty = (() => {
    if (!localGroup) {
      return null;
    }
    if ("bySelect" in localGroup) {
      return localGroup.bySelect.property;
    }
    if ("byStatus" in localGroup) {
      return localGroup.byStatus.property;
    }
    if ("byDate" in localGroup) {
      return localGroup.byDate.property;
    }
    if ("byCheckbox" in localGroup) {
      return localGroup.byCheckbox.property;
    }
    if ("byMultiSelect" in localGroup) {
      return localGroup.byMultiSelect.property;
    }
    if ("byText" in localGroup) {
      return localGroup.byText.property;
    }
    if ("byNumber" in localGroup) {
      return localGroup.byNumber.property;
    }
    return null;
  })();

  // Extract group type from config
  const groupType = (() => {
    if (!localGroup) {
      return null;
    }
    if ("bySelect" in localGroup) {
      return "select";
    }
    if ("byStatus" in localGroup) {
      return "status";
    }
    if ("byDate" in localGroup) {
      return "date";
    }
    if ("byCheckbox" in localGroup) {
      return "checkbox";
    }
    if ("byMultiSelect" in localGroup) {
      return "multiSelect";
    }
    if ("byText" in localGroup) {
      return "text";
    }
    if ("byNumber" in localGroup) {
      return "number";
    }
    return null;
  })();

  return {
    // Group config
    group: localGroup,
    setGroup,
    clearGroup,
    groupProperty,
    groupType,
    isGrouped: localGroup !== null,

    // Sort order (from group config)
    groupSortOrder: localGroup?.sort ?? "asc",
    setGroupSortOrder,

    // Hide empty groups (from group config)
    hideEmptyGroups: localGroup?.hideEmpty ?? false,
    setHideEmptyGroups,
  };
}
