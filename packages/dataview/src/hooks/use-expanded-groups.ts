import { useCallback, useEffect, useRef, useState } from "react";
import type { GroupConfigInput } from "../types";

interface UseExpandedGroupsOptions {
  /** Default expanded groups (initial state) */
  defaultExpanded?: string[];
  /** Current group keys from server/grouping */
  groupKeys: string[];
  /** Callback when group config changes (to reset expanded state) */
  setGroup: (group: GroupConfigInput | null) => void;
}

interface UseExpandedGroupsResult {
  /** Current expanded groups */
  expandedGroups: string[];
  /** Wrapper for setGroup that also resets expanded state */
  handleSetGroup: (group: GroupConfigInput | null) => void;
  /** Set expanded groups */
  setExpandedGroups: (groups: string[]) => void;
}

/**
 * Hook for managing expanded group state in grouped views.
 *
 * Features:
 * - Initializes expanded state based on defaultExpanded or mode (flat vs grouped)
 * - Tracks groupKeys changes to reset expanded state
 * - Provides handleSetGroup wrapper that resets expanded state on group config change
 */
export function useExpandedGroups({
  defaultExpanded,
  groupKeys,
  setGroup,
}: UseExpandedGroupsOptions): UseExpandedGroupsResult {
  // Compute initial expanded value
  const getInitialExpanded = useCallback(() => {
    if (defaultExpanded && defaultExpanded.length > 0) {
      return defaultExpanded;
    }
    // Flat mode (not grouped) - always expand to show data
    if (groupKeys.length === 1 && groupKeys[0] === "__ungrouped__") {
      return ["__ungrouped__"];
    }
    // Grouped mode - collapse all by default
    return [];
  }, [defaultExpanded, groupKeys]);

  // Local state for expanded groups (not persisted to URL)
  const [localExpanded, setLocalExpanded] =
    useState<string[]>(getInitialExpanded);

  // Track groupKeys for detecting changes
  const prevGroupKeysRef = useRef(groupKeys);

  // Handle groupKeys changes (e.g., switching between flat/grouped mode)
  useEffect(() => {
    const prevKeys = prevGroupKeysRef.current;
    const keysChanged =
      prevKeys.length !== groupKeys.length ||
      prevKeys.some((k, i) => k !== groupKeys[i]);

    if (keysChanged) {
      prevGroupKeysRef.current = groupKeys;
      setLocalExpanded(getInitialExpanded());
    }
  }, [groupKeys, getInitialExpanded]);

  const setExpandedGroups = useCallback((groups: string[]) => {
    setLocalExpanded(groups);
  }, []);

  // Reset expanded groups when group config changes
  const handleSetGroup = useCallback(
    (newGroup: GroupConfigInput | null) => {
      setGroup(newGroup);
      setLocalExpanded([]);
    },
    [setGroup]
  );

  return {
    expandedGroups: localExpanded,
    handleSetGroup,
    setExpandedGroups,
  };
}
