import { useMemo } from "react";
import {
	getGroupCounts,
	groupByProperty,
	validateGroupConfig,
} from "../lib/utils";
import type { DataViewProperty } from "../types/property-types";

export interface GroupConfig {
	groupBy: string;
	showAs?: "day" | "week" | "month" | "year" | "relative" | "group" | "option";
	startWeekOn?: "monday" | "sunday";
	sort?: "propertyAscending" | "propertyDescending";
	defaultExpanded?: string[];
	hideEmptyGroups?: boolean;
	/** Display aggregation counts in group headers (default: true) */
	showAggregation?: boolean;
	/** Controlled expansion state (array of expanded group keys) */
	expandedGroups?: string[];
	/** Callback when expansion state changes */
	onExpandedChange?: (groups: string[]) => void;
}

export interface GroupedDataItem<TData> {
	key: string;
	items: TData[];
	count: number;
	displayCount?: string; // "99+" or actual count as string
	sortValue: string | number;
}

export interface UseGroupConfigOptions {
	/** Whether grouping is required (BoardView: true, others: false) */
	required?: boolean;
	/** Auto-select a suitable property if groupBy not provided (BoardView only) */
	autoSelectGroupBy?: boolean;
}

export interface UseGroupConfigResult<TData> {
	/** Grouped data array ready for rendering, or null if no grouping */
	groupedData: GroupedDataItem<TData>[] | null;
	/** Validation error message, or null if valid */
	validationError: string | null;
	/** The property definition being grouped by */
	groupByProperty: DataViewProperty<TData> | undefined;
	/** Computed default value for accordion component */
	accordionDefaultValue: string[] | undefined;
}

/**
 * Hook to process group configuration with validation and intelligent defaults
 *
 * Handles:
 * - Validation using validateGroupConfig
 * - Intelligent defaults for showAs based on property type
 * - Grouping data using groupByProperty utility
 * - Filtering empty groups
 * - Sorting groups
 * - Computing accordion default value
 *
 * @param data - Data to group
 * @param properties - Property definitions
 * @param groupConfig - Raw group configuration from props
 * @param options - Additional options (required, autoSelectGroupBy)
 * @returns Grouped data with metadata, validation error, and property def
 */
export function useGroupConfig<TData>(
	data: TData[],
	properties: readonly DataViewProperty<TData>[] | DataViewProperty<TData>[],
	groupConfig: GroupConfig | undefined,
	options?: UseGroupConfigOptions
): UseGroupConfigResult<TData> {
	const { required = false, autoSelectGroupBy = false } = options || {};

	// Auto-select groupBy if enabled and not provided
	const activeGroupBy = useMemo(() => {
		if (groupConfig?.groupBy) {
			return groupConfig.groupBy;
		}
		if (!autoSelectGroupBy) {
			return undefined;
		}

		// Auto-select first status, select, or multi-select property
		const statusProp = properties.find((prop) => prop.type === "status");
		if (statusProp) {
			return String(statusProp.id);
		}

		const selectProp = properties.find((prop) => prop.type === "select");
		if (selectProp) {
			return String(selectProp.id);
		}

		const multiSelectProp = properties.find(
			(prop) => prop.type === "multiSelect"
		);
		if (multiSelectProp) {
			return String(multiSelectProp.id);
		}

		return properties[0] ? String(properties[0].id) : undefined;
	}, [groupConfig?.groupBy, autoSelectGroupBy, properties]);

	// Validate groupBy configuration
	const validationError = useMemo(() => {
		if (!activeGroupBy) {
			if (required) {
				return "No groupBy property specified and no suitable property found for grouping";
			}
			return null;
		}
		return validateGroupConfig(properties, activeGroupBy, groupConfig?.showAs);
	}, [activeGroupBy, required, properties, groupConfig?.showAs]);

	// Find the property being grouped by
	const groupByPropertyDef = useMemo(() => {
		if (!activeGroupBy) {
			return undefined;
		}
		return properties.find((prop) => String(prop.id) === activeGroupBy);
	}, [properties, activeGroupBy]);

	// Group data if groupBy is configured
	const groupedData = useMemo(() => {
		if (!(activeGroupBy && groupConfig) || validationError) {
			return null;
		}

		// Apply intelligent defaults for showAs based on property type
		let effectiveShowAs = groupConfig.showAs;
		if (!effectiveShowAs && groupByPropertyDef) {
			if (groupByPropertyDef.type === "date") {
				effectiveShowAs = "relative"; // Default for dates
			} else if (groupByPropertyDef.type === "status") {
				effectiveShowAs = "option"; // Default for status
			}
		}

		const { groups, sortValues } = groupByProperty(
			data,
			activeGroupBy,
			properties,
			effectiveShowAs,
			groupConfig.startWeekOn
		);

		// Get counts for sorting
		const counts = getGroupCounts(groups);

		// Convert to array for sorting
		let groupArray = Object.entries(groups).map(([key, items]) => ({
			key,
			items: items as TData[],
			count: counts[key] ?? (items as TData[]).length,
			sortValue: sortValues[key] ?? key,
		}));

		// Apply defaults: hideEmptyGroups defaults to true
		const hideEmptyGroups = groupConfig.hideEmptyGroups ?? true;
		if (hideEmptyGroups) {
			groupArray = groupArray.filter((group) => group.count > 0);
		}

		// Apply defaults: sort defaults to 'propertyAscending'
		const sort = groupConfig.sort ?? "propertyAscending";
		switch (sort) {
			case "propertyAscending":
				groupArray.sort((a, b) => {
					if (
						typeof a.sortValue === "number" &&
						typeof b.sortValue === "number"
					) {
						return a.sortValue - b.sortValue;
					}
					return String(a.sortValue).localeCompare(String(b.sortValue));
				});
				break;
			case "propertyDescending":
				groupArray.sort((a, b) => {
					if (
						typeof a.sortValue === "number" &&
						typeof b.sortValue === "number"
					) {
						return b.sortValue - a.sortValue;
					}
					return String(b.sortValue).localeCompare(String(a.sortValue));
				});
				break;
			default:
				break;
		}

		return groupArray;
	}, [
		data,
		properties,
		activeGroupBy,
		groupConfig,
		validationError,
		groupByPropertyDef,
	]);

	// Compute actual default expanded values for Accordion
	// Since defaultExpanded is now always an array, just return it
	const accordionDefaultValue = useMemo(() => {
		if (!(groupedData && groupConfig?.defaultExpanded)) {
			return undefined;
		}
		return groupConfig.defaultExpanded;
	}, [groupedData, groupConfig]);

	return {
		groupedData,
		validationError,
		groupByProperty: groupByPropertyDef,
		accordionDefaultValue,
	};
}
