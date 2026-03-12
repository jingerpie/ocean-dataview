"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { analyzeFilter } from "../lib/utils/filter-builder";
import type { WhereExpression, WhereNode, WhereRule } from "../types";

export interface UseToolbarStateOptions {
  filter: WhereNode[] | null;
  sorts: unknown[];
}

export interface UseToolbarStateReturn {
  /** Advanced filter (WhereExpression at root, displayed as AdvancedFilterChip) */
  advancedFilter: WhereExpression | null;
  /** Index of advancedFilter in root array */
  advancedFilterIndex: number | null;
  /** Whether any filters or sorts are active */
  hasActiveControls: boolean;
  /** Whether filter needs normalization */
  needsNormalization: boolean;
  /** Whether Row 2 is visible */
  row2Visible: boolean;
  /** Total number of rules in advanced filter */
  ruleCount: number;
  /** Set Row 2 visibility */
  setRow2Visible: (visible: boolean) => void;
  /** Simple filter conditions at root level (displayed as SimpleFilterChip) */
  simpleFilterConditions: Array<{ condition: WhereRule; index: number }>;
  /** Toggle Row 2 visibility */
  toggleRow2: () => void;
}

/**
 * Hook to manage NotionToolbar state logic.
 * Handles Row 2 visibility, filter analysis, and derived state.
 *
 * Filter structure:
 * - Root level is WhereNode[] (implicit AND)
 * - Simple filters (chips) = WhereRule items at root
 * - Advanced filter = WhereExpression item at root (first one found)
 * - Both can coexist, combined with AND logic
 */
export function useToolbarState({
  filter,
  sorts,
}: UseToolbarStateOptions): UseToolbarStateReturn {
  const [row2Visible, setRow2Visible] = useState(false);

  // Analyze filter structure using shared utility
  const filterAnalysis = useMemo(() => analyzeFilter(filter), [filter]);

  // Derived state - empty arrays are considered "no filter/sort"
  const hasActiveControls =
    (filter !== null && filter.length > 0) || sorts.length > 0;

  // Track previous hasActiveControls to detect when controls become active
  const prevHasActiveControls = useRef(hasActiveControls);

  // Auto-show Row 2 only when controls become active (not when already active)
  useEffect(() => {
    // Only show when transitioning from no controls to having controls
    if (hasActiveControls && !prevHasActiveControls.current) {
      setRow2Visible(true);
    }
    prevHasActiveControls.current = hasActiveControls;
  }, [hasActiveControls]);

  const toggleRow2 = useCallback(() => {
    setRow2Visible((prev) => !prev);
  }, []);

  return {
    hasActiveControls,
    row2Visible,
    setRow2Visible,
    toggleRow2,
    simpleFilterConditions: filterAnalysis.simpleConditions,
    advancedFilter: filterAnalysis.advancedFilter,
    advancedFilterIndex: filterAnalysis.advancedFilterIndex,
    ruleCount: filterAnalysis.ruleCount,
    needsNormalization: filterAnalysis.needsNormalization,
  };
}
