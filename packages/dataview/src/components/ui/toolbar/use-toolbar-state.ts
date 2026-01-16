"use client";

import type {
	CompoundFilter,
	Filter,
	FilterCondition,
} from "@ocean-dataview/shared/types";
import { analyzeFilter } from "@ocean-dataview/shared/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UseToolbarStateOptions {
	filter: Filter | null;
	sorts: unknown[];
}

export interface UseToolbarStateReturn {
	/** Whether any filters or sorts are active */
	hasActiveControls: boolean;
	/** Whether Row 2 is visible */
	row2Visible: boolean;
	/** Set Row 2 visibility */
	setRow2Visible: (visible: boolean) => void;
	/** Toggle Row 2 visibility */
	toggleRow2: () => void;
	/** Simple filter conditions at root level (displayed as FilterChip) */
	simpleFilterConditions: Array<{ condition: FilterCondition; index: number }>;
	/** Advanced filter (CompoundFilter at root, displayed as AdvancedFilterChip) */
	advancedFilter: CompoundFilter | null;
	/** Index of advancedFilter in root array */
	advancedFilterIndex: number | null;
	/** Total number of rules in advanced filter */
	ruleCount: number;
	/** Whether filter needs normalization */
	needsNormalization: boolean;
}

/**
 * Hook to manage NotionToolbar state logic.
 * Handles Row 2 visibility, filter analysis, and derived state.
 *
 * Filter structure:
 * - Root level is always { and: [...] }
 * - Simple filters (chips) = FilterCondition items at root
 * - Advanced filter = CompoundFilter item at root (first one found)
 * - Both can coexist, combined with AND logic
 */
export function useToolbarState({
	filter,
	sorts,
}: UseToolbarStateOptions): UseToolbarStateReturn {
	const [row2Visible, setRow2Visible] = useState(true);

	// Analyze filter structure using shared utility
	const filterAnalysis = useMemo(() => analyzeFilter(filter), [filter]);

	// Derived state
	const hasActiveControls = filter !== null || sorts.length > 0;

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
