import {
  isWhereExpression,
  isWhereRule,
  type WhereNode,
  type WhereRule,
} from "../types/data-table.type";
import {
  createCompoundFilter,
  getFilterItems,
  getFilterLogic,
} from "./filter-builder";

// Conditions that don't require a value
const VALUE_OPTIONAL_CONDITIONS = new Set(["isEmpty", "isNotEmpty"]);

/**
 * Check if a filter rule has a valid value
 */
function isRuleValid(rule: WhereRule): boolean {
  // These conditions don't need a value
  if (VALUE_OPTIONAL_CONDITIONS.has(rule.condition)) {
    return true;
  }

  const value = rule.value;

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
 * // Input: { and: [{ property: "name", condition: "eq", value: "" }] }
 * // Output: null (empty string is invalid)
 *
 * // Input: { and: [{ property: "status", condition: "isEmpty" }] }
 * // Output: same (isEmpty doesn't need a value)
 * ```
 */
export function validateFilter(filter: WhereNode | null): WhereNode | null {
  if (!filter) {
    return null;
  }

  // Single rule
  if (isWhereRule(filter)) {
    return isRuleValid(filter) ? filter : null;
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
