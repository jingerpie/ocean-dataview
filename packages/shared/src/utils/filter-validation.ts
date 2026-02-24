import {
  isWhereExpression,
  isWhereRule,
  type WhereExpression,
  type WhereNode,
  type WhereRule,
} from "../types/filter.type";

// Inline helpers (avoid circular dependency with filter-builder)
function getFilterItems(expr: WhereExpression): WhereNode[] {
  return expr.and ?? expr.or ?? [];
}

function getFilterLogic(expr: WhereExpression): "and" | "or" {
  return expr.and ? "and" : "or";
}

function createCompoundFilter(
  logic: "and" | "or",
  items: WhereNode[]
): WhereExpression {
  return logic === "and" ? { and: items } : { or: items };
}

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
 * Validate a single WhereNode, returning null if invalid.
 */
function validateNode(node: WhereNode): WhereNode | null {
  // Single rule
  if (isWhereRule(node)) {
    return isRuleValid(node) ? node : null;
  }

  // Compound filter
  if (isWhereExpression(node)) {
    const logic = getFilterLogic(node);
    const items = getFilterItems(node);

    // Recursively validate each item
    const validItems = items
      .map((item) => validateNode(item))
      .filter((item): item is WhereNode => item !== null);

    // If no valid items, return null
    if (validItems.length === 0) {
      return null;
    }

    return createCompoundFilter(logic, validItems);
  }

  return null;
}

/**
 * Validate and clean a filter array, removing conditions with empty values.
 * Returns null if the filter becomes empty after validation.
 *
 * @example
 * ```ts
 * // Input: [{ property: "name", condition: "eq", value: "" }]
 * // Output: null (empty string is invalid)
 *
 * // Input: [{ property: "status", condition: "isEmpty" }]
 * // Output: same (isEmpty doesn't need a value)
 * ```
 */
export function validateFilter(filter: WhereNode[] | null): WhereNode[] | null {
  if (!filter || filter.length === 0) {
    return null;
  }

  const validItems = filter
    .map((item) => validateNode(item))
    .filter((item): item is WhereNode => item !== null);

  return validItems.length > 0 ? validItems : null;
}
