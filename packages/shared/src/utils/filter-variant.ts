import type { FilterCondition, FilterVariant } from "../types/data-table.type";

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
// Property Type to Filter Variant Mapping
// ============================================================================

/**
 * Property type values that can be mapped to filter variants.
 * This mirrors the PropertyType from @ocean-dataview/dataview/types
 * but is defined here to avoid circular dependencies.
 */
type PropertyTypeValue =
  | "text"
  | "number"
  | "select"
  | "multiSelect"
  | "status"
  | "date"
  | "filesMedia"
  | "checkbox"
  | "url"
  | "email"
  | "phone"
  | "formula";

/**
 * Maps property type to the appropriate filter variant.
 * Used by filter UI components to determine which conditions and inputs to show.
 *
 * @param type - The property type (from DataViewProperty)
 * @returns The corresponding FilterVariant for filter UI
 */
export function getFilterVariantFromPropertyType(
  type: PropertyTypeValue | string
): FilterVariant {
  switch (type) {
    case "text":
    case "url":
    case "email":
    case "phone":
      return "text";
    case "number":
      return "number";
    case "select":
    case "status":
      return "select";
    case "multiSelect":
      return "multiSelect";
    case "date":
      return "date";
    case "checkbox":
      return "boolean";
    case "filesMedia":
      return "files";
    default:
      return "text";
  }
}
