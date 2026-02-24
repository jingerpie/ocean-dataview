import type {
  FilterCondition,
  PropertyType,
  WhereRule,
} from "@sparkyidea/shared/types";
import { getDefaultFilterCondition } from "./filter";

// ============================================================================
// Default Value for Conditions
// ============================================================================

/**
 * Gets the default value for a condition that requires one.
 * Returns undefined for conditions that don't need a default value.
 *
 * This is the single source of truth for condition default values.
 * Used by both `createRuleFromProperty` (new filters) and
 * `transformValueForCondition` (switching conditions).
 *
 * @param condition - The filter condition
 * @param propertyType - Optional property type for type-specific defaults
 * @returns Default value or undefined
 */
export function getDefaultValueForCondition(
  condition: FilterCondition,
  propertyType?: PropertyType
): unknown {
  switch (condition) {
    // Date: isRelativeToToday needs ["direction", count, "unit"]
    case "isRelativeToToday":
      return ["this", 1, "week"];

    // Checkbox: eq condition needs boolean default
    case "eq":
      if (propertyType === "checkbox") {
        return true;
      }
      return undefined;

    default:
      return undefined;
  }
}

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
 */
export function transformValueForCondition(
  oldCondition: FilterCondition,
  newCondition: FilterCondition,
  value: unknown,
  propertyType?: PropertyType
): unknown {
  // Check if new condition has a default value
  const defaultValue = getDefaultValueForCondition(newCondition, propertyType);
  if (defaultValue !== undefined) {
    return defaultValue;
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
  const defaultCondition = getDefaultFilterCondition(property.type);
  const defaultValue = getDefaultValueForCondition(
    defaultCondition,
    property.type
  );

  const rule: WhereRule = {
    property: String(property.id),
    condition: defaultCondition,
  };

  if (defaultValue !== undefined) {
    rule.value = defaultValue;
  }

  return rule;
}

/**
 * Applies a condition change to a rule, transforming the value as needed.
 * Returns a new rule object (immutable).
 *
 * @param rule - The current rule
 * @param newCondition - The new condition to apply
 * @param propertyType - Optional property type for type-specific defaults (e.g., checkbox)
 * @returns A new rule with the updated condition and transformed value
 *
 * @example
 * const rule = { property: "name", condition: "eq", value: "foo" };
 * const newRule = applyConditionChange(rule, "isEmpty");
 * // { property: "name", condition: "isEmpty", value: undefined }
 */
export function applyConditionChange(
  rule: WhereRule,
  newCondition: FilterCondition,
  propertyType?: PropertyType
): WhereRule {
  const newValue = transformValueForCondition(
    rule.condition,
    newCondition,
    rule.value,
    propertyType
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
