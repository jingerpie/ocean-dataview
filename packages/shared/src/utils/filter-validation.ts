import {
	isWhereCondition,
	isWhereExpression,
	type WhereCondition,
	type WhereNode,
} from "../types/data-table.type";
import {
	createCompoundFilter,
	getFilterItems,
	getFilterLogic,
} from "./filter-builder";

// Operators that don't require a value
const VALUE_OPTIONAL_OPERATORS = new Set(["isEmpty", "isNotEmpty"]);

/**
 * Check if a filter condition has a valid value
 */
function isConditionValid(condition: WhereCondition): boolean {
	// These operators don't need a value
	if (VALUE_OPTIONAL_OPERATORS.has(condition.operator)) {
		return true;
	}

	const value = condition.value;

	// Check for empty values
	if (value === undefined || value === null) {
		return false;
	}
	if (typeof value === "string" && value.trim() === "") {
		return false;
	}
	if (Array.isArray(value) && value.length === 0) {
		return false;
	}

	return true;
}

/**
 * Validate and clean a filter, removing conditions with empty values.
 * Returns null if the filter becomes empty after validation.
 *
 * @example
 * ```ts
 * // Input: { and: [{ property: "name", operator: "eq", value: "" }] }
 * // Output: null (empty string is invalid)
 *
 * // Input: { and: [{ property: "status", operator: "isEmpty" }] }
 * // Output: same (isEmpty doesn't need a value)
 * ```
 */
export function validateFilter(filter: WhereNode | null): WhereNode | null {
	if (!filter) {
		return null;
	}

	// Single condition
	if (isWhereCondition(filter)) {
		return isConditionValid(filter) ? filter : null;
	}

	// Compound filter
	if (isWhereExpression(filter)) {
		const logic = getFilterLogic(filter);
		const items = getFilterItems(filter);

		// Recursively validate each item
		const validItems = items
			.map((item) => validateFilter(item))
			.filter((item): item is WhereNode => item !== null);

		// If no valid items, return null
		if (validItems.length === 0) {
			return null;
		}

		return createCompoundFilter(logic, validItems);
	}

	return null;
}
