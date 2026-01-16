import type { DataViewProperty } from "../../types";
import { getUserLocale } from "./locale-helpers";
import {
	STATUS_GROUP_LABELS,
	STATUS_GROUP_ORDER,
	type StatusGroup,
} from "./status-constants";

export type ComputationType =
	| "count"
	| "sum"
	| "average"
	| "min"
	| "max"
	| "median"
	| "distinct";

export interface GroupedDataWithMeta<TData> {
	groups: Record<string, TData[]>;
	sortValues: Record<string, string | number>; // Mapping of group key to sortable value
}

interface GroupResult {
	groupKey: string;
	sortValue: string | number;
}

/**
 * Handle date property grouping
 */
function handleDateGrouping(
	value: unknown,
	showAs: "day" | "week" | "month" | "year" | "relative",
	startWeekOn?: "monday" | "sunday"
): GroupResult {
	const date = new Date(value as string);

	switch (showAs) {
		case "relative":
			return {
				groupKey: getRelativeDateGroup(date),
				sortValue: date.getTime(),
			};
		case "day":
			return {
				groupKey: date.toLocaleDateString(getUserLocale(), {
					month: "short",
					day: "numeric",
					year: "numeric",
				}),
				sortValue: date.getTime(),
			};
		case "week": {
			const weekStartDay = startWeekOn || "sunday";
			return {
				groupKey: formatWeekRange(date, weekStartDay),
				sortValue: getWeekStart(date, weekStartDay).getTime(),
			};
		}
		case "month":
			return {
				groupKey: date.toLocaleDateString(getUserLocale(), {
					month: "short",
					year: "numeric",
				}),
				sortValue: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
			};
		case "year":
			return {
				groupKey: date.getFullYear().toString(),
				sortValue: new Date(date.getFullYear(), 0, 1).getTime(),
			};
		default:
			return { groupKey: String(value), sortValue: String(value) };
	}
}

/**
 * Handle status property grouping by group (todo/inProgress/complete/canceled)
 */
function handleStatusGroupGrouping(
	value: unknown,
	config?: { options: Array<{ value: string; label: string; group: string }> },
	emptyLabel?: string
): GroupResult {
	const statusValue = String(value);
	const option = config?.options.find((opt) => opt.value === statusValue);

	if (option?.group && option.group in STATUS_GROUP_LABELS) {
		const group = option.group as StatusGroup;
		const groupKey = STATUS_GROUP_LABELS[group] || option.group;
		const sortValue = STATUS_GROUP_ORDER[group] ?? 999;
		return { groupKey, sortValue };
	}

	return {
		groupKey: emptyLabel || String(value),
		sortValue: emptyLabel || String(value),
	};
}

/**
 * Handle status property grouping by option (individual status values)
 */
function handleStatusOptionGrouping(
	value: unknown,
	config?: { options: Array<{ value: string; label: string; group: string }> },
	emptyLabel?: string
): GroupResult {
	const statusValue = String(value);
	const option = config?.options.find((opt) => opt.value === statusValue);

	if (option?.group && option.group in STATUS_GROUP_ORDER && config) {
		const group = option.group as StatusGroup;
		const groupIndex = STATUS_GROUP_ORDER[group] ?? 999;
		const optionIndex = config.options.indexOf(option);
		return {
			groupKey: option.label || statusValue,
			sortValue: groupIndex * 1000 + optionIndex,
		};
	}

	return {
		groupKey: emptyLabel || String(value),
		sortValue: emptyLabel || String(value),
	};
}

/**
 * Get group key and sort value for a data item
 */
function getGroupKeyAndSortValue<TData>(
	value: unknown,
	property: DataViewProperty<TData> | undefined,
	showAs:
		| "day"
		| "week"
		| "month"
		| "year"
		| "relative"
		| "option"
		| "group"
		| undefined,
	startWeekOn: "monday" | "sunday" | undefined,
	emptyGroupLabel: string
): GroupResult {
	// Handle date grouping
	if (
		property?.type === "date" &&
		value &&
		showAs &&
		showAs !== "group" &&
		showAs !== "option"
	) {
		return handleDateGrouping(value, showAs, startWeekOn);
	}

	// Handle status grouping by group
	if (property?.type === "status" && showAs === "group" && value) {
		const config = property.config as {
			options: Array<{ value: string; label: string; group: string }>;
		};
		return handleStatusGroupGrouping(value, config, emptyGroupLabel);
	}

	// Handle status grouping by option
	if (property?.type === "status" && value) {
		const config = property.config as {
			options: Array<{ value: string; label: string; group: string }>;
		};
		return handleStatusOptionGrouping(value, config, emptyGroupLabel);
	}

	// Default grouping
	return {
		groupKey: String(value || emptyGroupLabel),
		sortValue: String(value || emptyGroupLabel),
	};
}

/**
 * Group data by a property value
 * Handles date, select, status, and other property types
 * Returns both groups and sort values for proper ordering
 * @param data - Raw data to group
 * @param propertyId - Property ID (references property.id, not data key)
 * @param properties - Property definitions
 * @param showAs - How to group the data
 * @param startWeekOn - Week start day for week grouping
 */
export function groupByProperty<TData>(
	data: TData[],
	propertyId: string,
	properties: readonly DataViewProperty<TData>[],
	showAs?: "day" | "week" | "month" | "year" | "relative" | "option" | "group",
	startWeekOn?: "monday" | "sunday"
): GroupedDataWithMeta<TData> {
	const property = properties.find((p) => p.id === propertyId);
	const propertyName = property?.label || propertyId;
	const emptyGroupLabel = `No ${propertyName}`;
	const groups: Record<string, TData[]> = {};
	const sortValues: Record<string, string | number> = {};

	for (const item of data) {
		// Extract value using property transformation
		let value: unknown;
		if (property?.value) {
			// Use transformation function if defined
			value = property.value(item);
		} else {
			// Fallback: read from item[propertyId]
			value = (item as Record<string, unknown>)[propertyId];
		}

		const { groupKey, sortValue } = getGroupKeyAndSortValue(
			value,
			property,
			showAs,
			startWeekOn,
			emptyGroupLabel
		);

		if (!groups[groupKey]) {
			groups[groupKey] = [];
			sortValues[groupKey] = sortValue;
		}
		groups[groupKey]?.push(item);
	}

	return { groups, sortValues };
}

/**
 * Get relative date group matching Notion's approach
 * Groups dates into: Far past months, Last 30 days, Last 7 days, Yesterday, Today, Tomorrow, Next 7 days, Next 30 days, Far future months
 */
function getRelativeDateGroup(date: Date): string {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const itemDate = new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate()
	);

	const diffTime = itemDate.getTime() - today.getTime();
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	// Today
	if (diffDays === 0) {
		return "Today";
	}

	// Past dates
	if (diffDays < 0) {
		const absDays = Math.abs(diffDays);
		if (absDays === 1) {
			return "Yesterday";
		}
		if (absDays <= 7) {
			return "Last 7 days";
		}
		if (absDays <= 30) {
			return "Last 30 days";
		}
		// Far past: show as "MMM yyyy"
		return date.toLocaleDateString(getUserLocale(), {
			month: "short",
			year: "numeric",
		});
	}

	// Future dates
	if (diffDays === 1) {
		return "Tomorrow";
	}
	if (diffDays <= 7) {
		return "Next 7 days";
	}
	if (diffDays <= 30) {
		return "Next 30 days";
	}
	// Far future: show as "MMM yyyy"
	return date.toLocaleDateString(getUserLocale(), {
		month: "short",
		year: "numeric",
	});
}

/**
 * Get the start of the week for a given date
 * @param date The date to get the week start for
 * @param startWeekOn Whether weeks start on 'monday' or 'sunday' (default: 'sunday')
 */
function getWeekStart(
	date: Date,
	startWeekOn: "monday" | "sunday" = "sunday"
): Date {
	const d = new Date(date);
	const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.

	if (startWeekOn === "monday") {
		// For Monday start: Monday = 0, Tuesday = 1, ..., Sunday = 6
		const diff = day === 0 ? -6 : 1 - day;
		d.setDate(d.getDate() + diff);
	} else {
		// For Sunday start: Sunday = 0, Monday = 1, ..., Saturday = 6
		d.setDate(d.getDate() - day);
	}

	return d;
}

/**
 * Get the end of the week for a given date
 * @param date The date to get the week end for
 * @param startWeekOn Whether weeks start on 'monday' or 'sunday' (default: 'sunday')
 */
function getWeekEnd(
	date: Date,
	startWeekOn: "monday" | "sunday" = "sunday"
): Date {
	const weekStart = getWeekStart(date, startWeekOn);
	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekStart.getDate() + 6);
	return weekEnd;
}

/**
 * Format week range as "Nov 4-10, 2024"
 * @param date The date to format
 * @param startWeekOn Whether weeks start on 'monday' or 'sunday' (default: 'sunday')
 */
function formatWeekRange(
	date: Date,
	startWeekOn: "monday" | "sunday" = "sunday"
): string {
	const weekStart = getWeekStart(date, startWeekOn);
	const weekEnd = getWeekEnd(date, startWeekOn);

	const month = weekStart.toLocaleDateString(getUserLocale(), {
		month: "short",
	});
	const startDay = weekStart.getDate();
	const endDay = weekEnd.getDate();
	const year = weekStart.getFullYear();
	const endYear = weekEnd.getFullYear();

	// Check if week spans two years
	if (weekStart.getFullYear() !== weekEnd.getFullYear()) {
		const endMonth = weekEnd.toLocaleDateString(getUserLocale(), {
			month: "short",
		});
		return `${month} ${startDay} ${year}-${endMonth} ${endDay} ${endYear}`;
	}

	// Check if week spans two months
	if (weekStart.getMonth() !== weekEnd.getMonth()) {
		const endMonth = weekEnd.toLocaleDateString(getUserLocale(), {
			month: "short",
		});
		return `${month} ${startDay}-${endMonth} ${endDay} ${year}`;
	}

	return `${month} ${startDay}-${endDay} ${year}`;
}

/**
 * Compute grouped data with various computation functions
 * @param propertyId - Property ID to compute on (references property.id, not data key)
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex switch for different computation types
export function computeData<TData>(
	groupedData: Record<string, TData[]>,
	showAs: ComputationType,
	propertyId?: string,
	properties?: readonly DataViewProperty<TData>[]
): Record<string, number> {
	const result: Record<string, number> = {};

	// Find the property definition for value extraction
	const property = properties?.find((p) => p.id === propertyId);

	// Helper to extract value from item using property transformation
	const extractValue = (item: TData): unknown => {
		if (!propertyId) {
			return undefined;
		}

		if (property?.value) {
			// Use transformation function if defined
			return property.value(item);
		}
		// Fallback: read from item[propertyId]
		return (item as Record<string, unknown>)[propertyId];
	};

	for (const [groupKey, items] of Object.entries(groupedData)) {
		switch (showAs) {
			case "count":
				result[groupKey] = items.length;
				break;

			case "sum":
				if (!propertyId) {
					break;
				}
				result[groupKey] = items.reduce((sum, item) => {
					const value = Number(extractValue(item)) || 0;
					return sum + value;
				}, 0);
				break;

			case "average": {
				if (!propertyId) {
					break;
				}
				const sum = items.reduce(
					(s, item) => s + (Number(extractValue(item)) || 0),
					0
				);
				result[groupKey] = items.length > 0 ? sum / items.length : 0;
				break;
			}

			case "min": {
				if (!propertyId) {
					break;
				}
				const values = items.map((item) => Number(extractValue(item)) || 0);
				result[groupKey] = values.length > 0 ? Math.min(...values) : 0;
				break;
			}

			case "max": {
				if (!propertyId) {
					break;
				}
				const maxValues = items.map((item) => Number(extractValue(item)) || 0);
				result[groupKey] = maxValues.length > 0 ? Math.max(...maxValues) : 0;
				break;
			}

			case "median": {
				if (!propertyId) {
					break;
				}
				const sorted = items
					.map((item) => Number(extractValue(item)) || 0)
					.sort((a, b) => a - b);
				const mid = Math.floor(sorted.length / 2);
				if (sorted.length === 0) {
					result[groupKey] = 0;
				} else if (sorted.length % 2 === 0) {
					const upper = sorted[mid] ?? 0;
					const lower = sorted[mid - 1] ?? upper;
					result[groupKey] = (lower + upper) / 2;
				} else {
					result[groupKey] = sorted[mid] !== undefined ? sorted[mid] : 0;
				}
				break;
			}

			case "distinct": {
				if (!propertyId) {
					break;
				}
				const uniqueValues = new Set(
					items.map((item) => String(extractValue(item)))
				);
				result[groupKey] = uniqueValues.size;
				break;
			}

			default:
				result[groupKey] = items.length;
				break;
		}
	}

	return result;
}

export interface ChartDataPoint {
	name: string;
	value?: number; // Optional when using groupBy
	count?: number;
	percentage?: number;
	sortValue?: string | number; // For proper date/numeric sorting
	[key: string]: string | number | undefined; // Allow dynamic keys for grouped data (e.g., { name: "Jan", low: 5, medium: 10, high: 3 })
}

export type SortType =
	| "propertyAscending"
	| "propertyDescending"
	| "countAscending"
	| "countDescending";

/**
 * Transform computed data to chart-ready format
 */
export function transformToChartData(
	computedData: Record<string, number>,
	sortBy?: SortType,
	omitZeroValues?: boolean,
	hideGroups?: string[],
	sortValues?: Record<string, string | number>
): ChartDataPoint[] {
	let chartData = Object.entries(computedData).map(([name, value]) => ({
		name,
		value,
		sortValue: sortValues?.[name],
	}));

	// Filter by hideGroups
	if (hideGroups && hideGroups.length > 0) {
		chartData = chartData.filter((point) => !hideGroups.includes(point.name));
	}

	// Omit zero values if specified
	if (omitZeroValues) {
		chartData = chartData.filter((point) => point.value !== 0);
	}

	// Sort data
	if (sortBy) {
		switch (sortBy) {
			case "propertyAscending":
				// Use sortValue for proper ordering (dates, numbers, etc.), fallback to name
				chartData.sort((a, b) => {
					if (a.sortValue !== undefined && b.sortValue !== undefined) {
						if (
							typeof a.sortValue === "number" &&
							typeof b.sortValue === "number"
						) {
							return a.sortValue - b.sortValue;
						}
						return String(a.sortValue).localeCompare(String(b.sortValue));
					}
					return a.name.localeCompare(b.name);
				});
				break;
			case "propertyDescending":
				// Reverse sort using sortValue
				chartData.sort((a, b) => {
					if (a.sortValue !== undefined && b.sortValue !== undefined) {
						if (
							typeof a.sortValue === "number" &&
							typeof b.sortValue === "number"
						) {
							return b.sortValue - a.sortValue;
						}
						return String(b.sortValue).localeCompare(String(a.sortValue));
					}
					return b.name.localeCompare(a.name);
				});
				break;
			case "countAscending":
				// Sort by value ascending (shortest → tallest bars)
				chartData.sort((a, b) => a.value - b.value);
				break;
			case "countDescending":
				// Sort by value descending (tallest → shortest bars)
				chartData.sort((a, b) => b.value - a.value);
				break;
			default:
				break;
		}
	}

	// Calculate percentages for donut charts
	const total = chartData.reduce((sum, point) => sum + point.value, 0);
	chartData = chartData.map((point) => ({
		...point,
		percentage: total > 0 ? (point.value / total) * 100 : 0,
	}));

	return chartData;
}

/**
 * Compute grouped data with secondary grouping (for stacked/grouped charts)
 * Returns data in format: { xAxisGroup: { secondaryGroup: value, ... }, ... }
 * @param secondaryPropertyId - Property ID for secondary grouping (references property.id, not data key)
 * @param computePropertyId - Property ID to compute on (references property.id, not data key)
 */
export function computeGroupedData<TData>(
	xAxisGroupedData: Record<string, TData[]>,
	secondaryPropertyId: string,
	properties: readonly DataViewProperty<TData>[],
	computationType: ComputationType,
	computePropertyId?: string,
	groupByConfig?: {
		showAs?:
			| "day"
			| "week"
			| "month"
			| "year"
			| "relative"
			| "option"
			| "group";
		startWeekOn?: "monday" | "sunday";
	}
): Record<string, Record<string, number>> {
	const result: Record<string, Record<string, number>> = {};

	// For each x-axis group, compute values for each secondary group
	for (const [xAxisKey, items] of Object.entries(xAxisGroupedData)) {
		// Group items by the secondary property
		const { groups: secondaryGroups } = groupByProperty(
			items,
			secondaryPropertyId,
			properties,
			groupByConfig?.showAs,
			groupByConfig?.startWeekOn
		);

		// Compute values for each secondary group
		const computed = computeData(
			secondaryGroups,
			computationType,
			computePropertyId,
			properties
		);
		result[xAxisKey] = computed;
	}

	return result;
}

/**
 * Get the raw count of items in each group (useful for tooltips)
 */
export function getGroupCounts<TData>(
	groupedData: Record<string, TData[]>
): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const [key, items] of Object.entries(groupedData)) {
		counts[key] = items.length;
	}
	return counts;
}
