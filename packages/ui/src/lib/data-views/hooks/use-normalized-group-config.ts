import { useMemo } from "react";
import type { GroupConfig } from "./use-group-config";

/**
 * Normalizes group configuration for consistent usage across views
 * Converts groupBy property to string and provides defaults
 *
 * @param groupBy - Raw group configuration from props
 * @returns Normalized GroupConfig or undefined
 */
export function useNormalizedGroupConfig<TData>(
	groupBy:
		| {
				groupBy: keyof TData;
				showAs?:
					| "day"
					| "week"
					| "month"
					| "year"
					| "relative"
					| "group"
					| "option";
				startWeekOn?: "monday" | "sunday";
				sort?: "propertyAscending" | "propertyDescending";
				defaultExpanded?: string[];
				hideEmptyGroups?: boolean;
		  }
		| undefined,
): GroupConfig | undefined {
	return useMemo(() => {
		if (!groupBy) return undefined;

		return {
			groupBy: String(groupBy.groupBy),
			showAs: groupBy.showAs,
			startWeekOn: groupBy.startWeekOn,
			sort: groupBy.sort,
			defaultExpanded: groupBy.defaultExpanded,
			hideEmptyGroups: groupBy.hideEmptyGroups,
		};
	}, [groupBy]);
}
