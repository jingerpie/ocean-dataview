import type { FilterCondition } from "@ocean-dataview/shared/types";
import { format, parseISO } from "date-fns";

/**
 * Date range value for isBetween condition
 */
interface DateRangeValue {
	from?: string;
	to?: string;
}

/**
 * Relative date value for isRelativeToToday condition
 */
interface RelativeToTodayValue {
	direction: "Past" | "This" | "Next";
	count: number;
	unit: "day" | "week" | "month" | "year";
}

/**
 * Select option for select/multi-select values
 */
interface SelectOption {
	value: string;
	label: string;
}

/**
 * Filter variant determines how conditions are displayed
 */
type FilterVariant =
	| "text"
	| "number"
	| "date"
	| "dateRange"
	| "boolean"
	| "select"
	| "multiSelect";

interface GetFilterPreviewOptions {
	condition: FilterCondition;
	value: unknown;
	variant: FilterVariant;
	/** For select/multi-select, provide options to get labels */
	options?: SelectOption[];
}

/**
 * Format a date string to short format (e.g., "Jan 22")
 */
function formatDateShort(dateStr: string): string {
	try {
		const date = parseISO(dateStr);
		return format(date, "MMM d");
	} catch {
		return dateStr;
	}
}

/**
 * Format relative date value to display string
 */
function formatRelativeDate(value: RelativeToTodayValue): string {
	const { direction, count, unit } = value;

	if (direction === "This") {
		return `This ${unit}`;
	}

	const pluralUnit = count === 1 ? unit : `${unit}s`;
	return `${direction} ${count} ${pluralUnit}`;
}

/**
 * Get label for select value(s) from options
 */
function getSelectLabels(
	value: unknown,
	options?: SelectOption[]
): string | null {
	if (!value) {
		return null;
	}

	const values = Array.isArray(value) ? value : [value];
	if (values.length === 0) {
		return null;
	}

	if (!options || options.length === 0) {
		return values.join(", ");
	}

	const labels = values.map((v) => {
		const option = options.find((o) => o.value === v);
		return option?.label ?? v;
	});

	return labels.join(", ");
}

/**
 * Get preview for boolean (checkbox) variant
 */
function getBooleanPreview(value: unknown): string {
	if (value === true) {
		return "Checked";
	}
	if (value === false) {
		return "Unchecked";
	}
	return "";
}

/**
 * Get preview for number variant
 */
function getNumberPreview(condition: FilterCondition, value: unknown): string {
	const numValue = value != null ? String(value) : "";
	switch (condition) {
		case "eq":
			return `= ${numValue}`;
		case "ne":
			return `≠ ${numValue}`;
		case "gt":
			return `> ${numValue}`;
		case "lt":
			return `< ${numValue}`;
		case "gte":
			return `≥ ${numValue}`;
		case "lte":
			return `≤ ${numValue}`;
		default:
			return numValue;
	}
}

/**
 * Get preview for date variant
 */
function getDatePreview(condition: FilterCondition, value: unknown): string {
	if (condition === "isRelativeToToday" && value) {
		return formatRelativeDate(value as RelativeToTodayValue);
	}

	if (condition === "isBetween" && value) {
		const range = value as DateRangeValue;
		const from = range.from ? formatDateShort(range.from) : "?";
		const to = range.to ? formatDateShort(range.to) : "?";
		return `${from} → ${to}`;
	}

	const dateStr = value ? formatDateShort(value as string) : "";

	switch (condition) {
		case "eq":
			return dateStr;
		case "lt":
			return `Before ${dateStr}`;
		case "gt":
			return `After ${dateStr}`;
		case "lte":
			return `On or before ${dateStr}`;
		case "gte":
			return `On or after ${dateStr}`;
		default:
			return dateStr;
	}
}

/**
 * Get preview for select variant
 */
function getSelectPreview(
	condition: FilterCondition,
	value: unknown,
	options?: SelectOption[]
): string {
	const label = getSelectLabels(value, options);
	if (!label) {
		return "";
	}

	switch (condition) {
		case "eq":
		case "inArray":
			return label;
		case "ne":
		case "notInArray":
			return `Not ${label}`;
		default:
			return label;
	}
}

/**
 * Get preview for multi-select variant
 */
function getMultiSelectPreview(
	condition: FilterCondition,
	value: unknown,
	options?: SelectOption[]
): string {
	const label = getSelectLabels(value, options);
	if (!label) {
		return "";
	}

	switch (condition) {
		case "inArray":
			return label;
		case "notInArray":
			return `Not ${label}`;
		default:
			return label;
	}
}

/**
 * Get preview for text variant
 */
function getTextPreview(condition: FilterCondition, value: unknown): string {
	const textValue = value != null ? String(value) : "";

	switch (condition) {
		case "eq":
		case "iLike":
			return textValue;
		case "ne":
		case "notILike":
			return textValue ? `Not ${textValue}` : "";
		case "startsWith":
			return textValue ? `Starts with ${textValue}` : "";
		case "endsWith":
			return textValue ? `Ends with ${textValue}` : "";
		default:
			return textValue;
	}
}

/**
 * Generate preview string for a filter condition
 */
export function getFilterPreview({
	condition,
	value,
	variant,
	options,
}: GetFilterPreviewOptions): string {
	// Empty conditions - same for all variants
	if (condition === "isEmpty") {
		return "Is empty";
	}
	if (condition === "isNotEmpty") {
		return "Is not empty";
	}

	switch (variant) {
		case "boolean":
			return getBooleanPreview(value);
		case "number":
			return getNumberPreview(condition, value);
		case "date":
		case "dateRange":
			return getDatePreview(condition, value);
		case "select":
			return getSelectPreview(condition, value, options);
		case "multiSelect":
			return getMultiSelectPreview(condition, value, options);
		default:
			return getTextPreview(condition, value);
	}
}
