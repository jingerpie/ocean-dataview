import type {
  FilterCondition,
  Quantifier,
  WhereRule,
} from "../types/filter.type";
import { isDisplayRollup, type PropertyMeta } from "../types/property.type";
import { getDefaultFilterConditionForProperty } from "./filter";

// ============================================================================
// Filter Value Transformation (for condition changes)
// ============================================================================

/** Returns the default value for a condition */
function getDefaultValueForCondition(condition: FilterCondition): unknown {
  return condition === "isRelativeToToday" ? ["this", 1, "week"] : undefined;
}

/**
 * Transforms a filter value when the condition changes.
 * Entering or leaving special conditions resets to the new condition's default.
 */
function transformValueForCondition(
  oldCondition: FilterCondition,
  newCondition: FilterCondition,
  value: unknown
): unknown {
  const isSpecial = (c: FilterCondition) =>
    c === "isRelativeToToday" ||
    c === "isEmpty" ||
    c === "isNotEmpty" ||
    c === "isBetween";

  if (isSpecial(newCondition) || isSpecial(oldCondition)) {
    return getDefaultValueForCondition(newCondition);
  }
  return value;
}

// ============================================================================
// Rule Creation & Modification Utilities
// ============================================================================

/**
 * Creates a default filter rule from a property.
 * Resolves rollup effective type to determine the default condition and value.
 *
 * @param property - Property metadata (id, type, and config for rollups)
 * @returns A new WhereRule with default condition and value for the property type
 *
 * @example
 * const rule = createRuleFromProperty({ id: "name", type: "text" });
 * // { property: "name", condition: "iLike" }
 *
 * const rule = createRuleFromProperty({ id: "createdAt", type: "date" });
 * // { property: "createdAt", condition: "isRelativeToToday", value: ["this", 1, "week"] }
 */
export function createRuleFromProperty(
  property: Pick<PropertyMeta, "config" | "id" | "type">
): WhereRule {
  const condition = getDefaultFilterConditionForProperty(
    property as PropertyMeta
  );
  const rule: WhereRule = {
    property: String(property.id),
    condition,
    value: getDefaultValueForCondition(condition),
  };
  if (isDisplayRollup(property as PropertyMeta)) {
    rule.quantifier = "any";
  }
  return rule;
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
 * Applies a quantifier change to a rule. Returns a new rule object (immutable).
 */
export function applyQuantifierChange(
  rule: WhereRule,
  quantifier: Quantifier
): WhereRule {
  return { ...rule, quantifier };
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
    // Filter to only string elements, coerce others
    return value
      .filter((v) => v != null)
      .map((v) => (typeof v === "string" ? v : String(v)));
  }
  if (value != null && value !== "") {
    return [String(value)];
  }
  return [];
}
