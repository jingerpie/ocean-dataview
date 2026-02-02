import type {
  FilterCondition,
  PropertyType,
  WhereRule,
} from "../types/filter.type";
import { getDefaultFilterCondition } from "./filter";
import { createDefaultCondition } from "./filter-builder";

// ============================================================================
// Filter Value Transformation (for condition changes)
// ============================================================================

/**
 * Transforms a filter value when the condition changes.
 *
 * Conditions with incompatible value formats:
 * - isEmpty/isNotEmpty: no value needed
 * - isBetween: needs [start, end] array
 * - isRelativeToToday: needs [direction, count, unit] tuple
 *
 * Switching to/from these resets the value (validateFilter removes incomplete filters).
 * Only isRelativeToToday gets a default because it's the only one that can work immediately.
 */
export function transformValueForCondition(
  oldCondition: FilterCondition,
  newCondition: FilterCondition,
  value: unknown
): unknown {
  // To isRelativeToToday - use working default
  if (newCondition === "isRelativeToToday") {
    return ["this", 1, "week"];
  }

  // To isEmpty/isNotEmpty - no value needed
  if (newCondition === "isEmpty" || newCondition === "isNotEmpty") {
    return undefined;
  }

  // From isEmpty/isNotEmpty/isRelativeToToday/isBetween - reset (incompatible format)
  if (
    oldCondition === "isEmpty" ||
    oldCondition === "isNotEmpty" ||
    oldCondition === "isRelativeToToday" ||
    oldCondition === "isBetween"
  ) {
    return undefined;
  }

  // To isBetween - reset (user picks fresh range)
  if (newCondition === "isBetween") {
    return undefined;
  }

  // All other transitions - keep value
  return value;
}

// ============================================================================
// Rule Creation & Modification Utilities
// ============================================================================

/**
 * Property metadata required for creating filter rules.
 * Minimal interface to avoid dependency on full PropertyMeta type.
 */
interface PropertyForFilter {
  id: string;
  type: PropertyType;
}

/**
 * Creates a default filter rule from a property.
 * Uses property type directly to determine the default condition.
 *
 * @param property - Property with id and type
 * @returns A new WhereRule with default condition for the property type
 *
 * @example
 * const rule = createRuleFromProperty({ id: "name", type: "text" });
 * // { property: "name", condition: "iLike" }
 *
 * const rule = createRuleFromProperty({ id: "createdAt", type: "date" });
 * // { property: "createdAt", condition: "isRelativeToToday" }
 */
export function createRuleFromProperty(property: PropertyForFilter): WhereRule {
  const defaultCondition = getDefaultFilterCondition(property.type);
  return createDefaultCondition(String(property.id), defaultCondition);
}

/**
 * Applies a condition change to a rule, transforming the value as needed.
 * Returns a new rule object (immutable).
 *
 * @param rule - The current rule
 * @param newCondition - The new condition to apply
 * @returns A new rule with the updated condition and transformed value
 *
 * @example
 * const rule = { property: "name", condition: "eq", value: "foo" };
 * const newRule = applyConditionChange(rule, "isEmpty");
 * // { property: "name", condition: "isEmpty", value: undefined }
 */
export function applyConditionChange(
  rule: WhereRule,
  newCondition: FilterCondition
): WhereRule {
  const newValue = transformValueForCondition(
    rule.condition,
    newCondition,
    rule.value
  );
  return {
    ...rule,
    condition: newCondition,
    value: newValue,
  };
}

/**
 * Extracts selected values from a filter rule value.
 * Handles both single values and arrays (for multiSelect).
 *
 * @param value - The rule value (string, string[], or undefined)
 * @returns Array of selected value strings
 *
 * @example
 * extractSelectValues("foo") // ["foo"]
 * extractSelectValues(["foo", "bar"]) // ["foo", "bar"]
 * extractSelectValues(undefined) // []
 * extractSelectValues(null) // []
 */
export function extractSelectValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value as string[];
  }
  if (value != null && value !== "") {
    return [String(value)];
  }
  return [];
}
