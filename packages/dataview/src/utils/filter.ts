import { DATA_TABLE_CONFIG } from "../types/config";
import type { FilterCondition, PropertyType } from "../types/filter.type";

/**
 * Gets available filter conditions for a property type.
 * Groups property types that share the same conditions internally.
 */
export function getFilterConditions(propertyType: PropertyType) {
  switch (propertyType) {
    // Text-like types share text conditions
    case "text":
    case "url":
    case "email":
    case "phone":
      return DATA_TABLE_CONFIG.textConditions;

    case "number":
      return DATA_TABLE_CONFIG.numericConditions;

    // Select-like types share select conditions
    case "select":
    case "status":
      return DATA_TABLE_CONFIG.selectConditions;

    case "multiSelect":
      return DATA_TABLE_CONFIG.multiSelectConditions;

    case "date":
      return DATA_TABLE_CONFIG.dateConditions;

    case "checkbox":
      return DATA_TABLE_CONFIG.booleanConditions;

    case "filesMedia":
      return DATA_TABLE_CONFIG.filesConditions;

    case "formula":
      // Formula only supports isEmpty/isNotEmpty
      return DATA_TABLE_CONFIG.filesConditions;

    case "button":
      // Button is not filterable
      throw new Error(`PropertyType "${propertyType}" is not filterable`);

    default: {
      const exhaustiveCheck: never = propertyType;
      throw new Error(`Unknown PropertyType: ${exhaustiveCheck}`);
    }
  }
}

/**
 * Gets the default filter condition for a property type.
 */
export function getDefaultFilterCondition(
  propertyType: PropertyType
): FilterCondition {
  switch (propertyType) {
    // Text-like types default to "contains"
    case "text":
    case "url":
    case "email":
    case "phone":
      return "iLike";

    // Date defaults to relative to today
    case "date":
      return "isRelativeToToday";

    default: {
      // Use first condition as default
      const conditions = getFilterConditions(propertyType);
      return conditions[0]?.value ?? "eq";
    }
  }
}

/**
 * Validates that a condition is valid for the given property type
 */
export function isValidConditionForPropertyType(
  condition: FilterCondition,
  propertyType: PropertyType
): boolean {
  const validConditions = getFilterConditions(propertyType);
  return validConditions.some((c) => c.value === condition);
}
