import type {
  FilterCondition,
  PropertyType,
  WhereRule,
} from "@sparkyidea/shared/types";
import { getDefaultFilterCondition } from "./filter";

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
 * Property metadata required for creating filter rules.
 * Minimal interface to avoid dependency on full PropertyMeta type.
 */
interface PropertyForFilter {
  id: string;
  type: PropertyType;
}

/**
 * Creates a default filter rule from a property.
 * Uses property type directly to determine the default condition and value.
 *
 * @param property - Property with id and type
 * @returns A new WhereRule with default condition and value for the property type
 *
 * @example
 * const rule = createRuleFromProperty({ id: "name", type: "text" });
 * // { property: "name", condition: "iLike" }
 *
 * const rule = createRuleFromProperty({ id: "createdAt", type: "date" });
 * // { property: "createdAt", condition: "isRelativeToToday", value: ["this", 1, "week"] }
 */
export function createRuleFromProperty(property: PropertyForFilter): WhereRule {
  const condition = getDefaultFilterCondition(property.type);
  return {
    property: String(property.id),
    condition,
    value: getDefaultValueForCondition(condition),
  };
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
