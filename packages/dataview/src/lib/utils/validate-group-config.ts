import type { DataViewProperty } from "../../types";

/**
 * Validates showAs configuration against property type
 * @param propertyType - The type of the property being grouped by
 * @param propertyKey - The key of the property for error messages
 * @param showAs - The showAs configuration value
 * @returns Error message string if invalid, null if valid
 */
export function validateShowAs(
	propertyType: string,
	propertyKey: string,
	showAs: string | undefined
): string | null {
	if (!showAs) {
		return null;
	}

	// Check date property with date-specific showAs
	if (propertyType === "date") {
		const validDateShowAs = ["day", "week", "month", "year", "relative"];
		if (!validDateShowAs.includes(showAs)) {
			return `Property "${propertyKey}" is type 'date' and cannot use showAs: '${showAs}'. Valid options for date properties: ${validDateShowAs.join(
				", "
			)}`;
		}
	}

	// Check status property with status-specific showAs
	if (propertyType === "status") {
		const validStatusShowAs = ["option", "group"];
		if (!validStatusShowAs.includes(showAs)) {
			return `Property "${propertyKey}" is type 'status' and cannot use showAs: '${showAs}'. Valid options for status properties: ${validStatusShowAs.join(
				", "
			)}`;
		}
	}

	// Check other properties don't use date/status showAs
	if (propertyType !== "date" && propertyType !== "status") {
		const dateOrStatusShowAs = [
			"day",
			"week",
			"month",
			"year",
			"relative",
			"option",
			"group",
		];
		if (dateOrStatusShowAs.includes(showAs)) {
			return `Property "${propertyKey}" is type '${propertyType}' and cannot use showAs: '${showAs}'. This showAs option is only for date or status properties.`;
		}
	}

	return null;
}

/**
 * Validates group configuration for views
 * @param properties - Array of property definitions
 * @param groupBy - The property ID to group by (references property.id, not data key)
 * @param showAs - Optional showAs configuration
 * @returns Error message string if invalid, null if valid
 */
export function validateGroupConfig<TData>(
	properties: readonly DataViewProperty<TData>[],
	groupBy: string,
	showAs?: "day" | "week" | "month" | "year" | "relative" | "group" | "option"
): string | null {
	// groupBy references property IDs
	// Find a property that matches this ID for validation
	const groupByProperty = properties.find((prop) => prop.id === groupBy);

	// If no property found, allow it - user may define property later
	// The component will handle missing property gracefully
	if (!groupByProperty) {
		return null;
	}

	// If property found, validate showAs compatibility with property type
	return validateShowAs(groupByProperty.type, String(groupBy), showAs);
}
