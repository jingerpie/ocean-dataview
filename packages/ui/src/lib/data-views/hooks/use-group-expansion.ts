"use client";

import { parseAsExpanded } from "@ocean-dataview/shared/lib";
import { useQueryState } from "nuqs";
import { startTransition, useCallback } from "react";

// ============================================================================
// Types
// ============================================================================

export interface UseGroupExpansionOptions {
	/**
	 * Default expanded groups (static array)
	 * For "expand all", caller passes all group keys: Object.keys(counts)
	 */
	defaultExpanded?: string[];
}

export interface UseGroupExpansionResult {
	/** Current expanded group keys (from URL) */
	expandedGroups: string[];
	/** Handler for accordion value changes */
	handleAccordionChange: (value: string[]) => void;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Hook for managing group expansion state with URL persistence.
 *
 * Pure state management - no fetch logic.
 * Pass `expandedGroups` to `usePagination` which handles fetching via `enabled` flag.
 *
 * @example
 * ```tsx
 * const { expandedGroups, handleAccordionChange } = useGroupExpansion({
 *   defaultExpanded: ["PENDING"],
 * });
 *
 * const { data, pagination } = usePagination({
 *   expandedGroups,
 *   counts: groupCounts,
 *   createQueryOptions: (...) => trpc.listing.getMany.queryOptions({...}),
 * });
 *
 * <TableView
 *   expandedGroups={expandedGroups}
 *   onExpandedChange={handleAccordionChange}
 * />
 * ```
 */
export function useGroupExpansion(
	options: UseGroupExpansionOptions,
): UseGroupExpansionResult {
	const { defaultExpanded } = options;

	const staticDefault = defaultExpanded ?? [];

	const [expanded, setExpanded] = useQueryState(
		"expanded",
		parseAsExpanded.withDefault(staticDefault).withOptions({
			shallow: false,
			clearOnDefault: true,
		}),
	);

	const handleAccordionChange = useCallback(
		(value: string[]) => {
			startTransition(() => {
				setExpanded(value);
			});
		},
		[setExpanded],
	);

	return {
		expandedGroups: expanded,
		handleAccordionChange,
	};
}
