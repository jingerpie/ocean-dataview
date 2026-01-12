"use client";

import {
	type Filter,
	type FilterCondition,
	isCompoundFilter,
	isFilterCondition,
} from "@ocean-dataview/shared/types";
import { getFilterItems, normalizeFilter } from "@ocean-dataview/shared/utils";
import * as React from "react";

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
	/** Whether the filter is a compound filter (nested/multiple conditions) */
	isFilterCompound: boolean;
	/** Simple filter conditions (top-level only) */
	simpleFilterConditions: Array<{ condition: FilterCondition; index: number }>;
	/** Total number of filter rules */
	ruleCount: number;
}

/**
 * Hook to manage NotionToolbar state logic.
 * Handles Row 2 visibility, filter analysis, and derived state.
 */
export function useToolbarState({
	filter,
	sorts,
}: UseToolbarStateOptions): UseToolbarStateReturn {
	const [row2Visible, setRow2Visible] = React.useState(true);

	// Analyze filter structure
	const filterAnalysis = React.useMemo(() => {
		const normalized = normalizeFilter(filter);

		if (!normalized) {
			return {
				isCompound: false,
				simpleConditions: [] as Array<{
					condition: FilterCondition;
					index: number;
				}>,
				ruleCount: 0,
			};
		}

		const items = getFilterItems(normalized);
		const simpleConditions: Array<{
			condition: FilterCondition;
			index: number;
		}> = [];
		let ruleCount = 0;
		let hasNestedGroups = false;

		const countRules = (f: Filter): number => {
			if (isFilterCondition(f)) {
				return 1;
			}
			if (isCompoundFilter(f)) {
				const children = getFilterItems(f);
				return children.reduce(
					(sum: number, child: Filter) => sum + countRules(child),
					0,
				);
			}
			return 0;
		};

		for (const [index, item] of items.entries()) {
			if (isFilterCondition(item)) {
				simpleConditions.push({ condition: item, index });
				ruleCount += 1;
			} else {
				hasNestedGroups = true;
				ruleCount += countRules(item);
			}
		}

		// Filter is compound if it has nested groups OR multiple conditions with OR logic
		const isCompound =
			hasNestedGroups || ("or" in normalized && items.length > 1);

		return {
			isCompound,
			simpleConditions,
			ruleCount,
		};
	}, [filter]);

	// Derived state
	const hasActiveControls = filter !== null || sorts.length > 0;

	// Track previous hasActiveControls to detect when controls become active
	const prevHasActiveControls = React.useRef(hasActiveControls);

	// Auto-show Row 2 only when controls become active (not when already active)
	React.useEffect(() => {
		// Only show when transitioning from no controls to having controls
		if (hasActiveControls && !prevHasActiveControls.current) {
			setRow2Visible(true);
		}
		prevHasActiveControls.current = hasActiveControls;
	}, [hasActiveControls]);

	const toggleRow2 = React.useCallback(() => {
		setRow2Visible((prev) => !prev);
	}, []);

	return {
		hasActiveControls,
		row2Visible,
		setRow2Visible,
		toggleRow2,
		isFilterCompound: filterAnalysis.isCompound,
		simpleFilterConditions: filterAnalysis.simpleConditions,
		ruleCount: filterAnalysis.ruleCount,
	};
}
