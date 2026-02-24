import { dataTableConfig } from "@sparkyidea/shared/config";
import type { FilterCondition, PropertyType } from "@sparkyidea/shared/types";

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
      return dataTableConfig.textConditions;

    case "number":
      return dataTableConfig.numericConditions;

    // Select-like types share select conditions
    case "select":
    case "status":
      return dataTableConfig.selectConditions;

    case "multiSelect":
      return dataTableConfig.multiSelectConditions;

    case "date":
      return dataTableConfig.dateConditions;

    case "checkbox":
      return dataTableConfig.booleanConditions;

    case "filesMedia":
      return dataTableConfig.filesConditions;

    case "formula":
      // Formula only supports isEmpty/isNotEmpty
      return dataTableConfig.filesConditions;

    default:
      return dataTableConfig.textConditions;
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
