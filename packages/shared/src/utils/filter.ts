import { dataTableConfig } from "../config/data-table";
import type { FilterCondition, FilterVariant } from "../types/data-table.type";

export function getFilterConditions(filterVariant: FilterVariant) {
  const conditionMap: Record<
    FilterVariant,
    { label: string; value: FilterCondition }[]
  > = {
    text: dataTableConfig.textConditions,
    number: dataTableConfig.numericConditions,
    range: dataTableConfig.numericConditions,
    date: dataTableConfig.dateConditions,
    dateRange: dataTableConfig.dateConditions,
    boolean: dataTableConfig.booleanConditions,
    select: dataTableConfig.selectConditions,
    multiSelect: dataTableConfig.multiSelectConditions,
    files: dataTableConfig.filesConditions,
  };

  return conditionMap[filterVariant] ?? dataTableConfig.textConditions;
}

export function getDefaultFilterCondition(
  filterVariant: FilterVariant
): FilterCondition {
  // Explicit defaults that differ from first condition in list
  const explicitDefaults: Partial<Record<FilterVariant, FilterCondition>> = {
    text: "iLike", // Contains (3rd in list)
    date: "isRelativeToToday", // Is relative to today (7th in list)
    dateRange: "isRelativeToToday",
  };

  const explicit = explicitDefaults[filterVariant];
  if (explicit) {
    return explicit;
  }

  // Otherwise use first condition
  const conditions = getFilterConditions(filterVariant);
  return conditions[0]?.value ?? "eq";
}

/**
 * Validates that a condition is valid for the given filter variant
 */
export function isValidConditionForVariant(
  condition: FilterCondition,
  variant: FilterVariant
): boolean {
  const validConditions = getFilterConditions(variant);
  return validConditions.some((c) => c.value === condition);
}
