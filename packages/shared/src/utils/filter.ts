import { dataTableConfig } from "../config/data-table";
import type { FilterOperator, FilterVariant } from "../types/data-table.type";

export function getFilterOperators(filterVariant: FilterVariant) {
	const operatorMap: Record<
		FilterVariant,
		{ label: string; value: FilterOperator }[]
	> = {
		text: dataTableConfig.textOperators,
		number: dataTableConfig.numericOperators,
		range: dataTableConfig.numericOperators,
		date: dataTableConfig.dateOperators,
		dateRange: dataTableConfig.dateOperators,
		boolean: dataTableConfig.booleanOperators,
		select: dataTableConfig.selectOperators,
		multiSelect: dataTableConfig.multiSelectOperators,
		files: dataTableConfig.filesOperators,
	};

	return operatorMap[filterVariant] ?? dataTableConfig.textOperators;
}

export function getDefaultFilterOperator(
	filterVariant: FilterVariant
): FilterOperator {
	// Explicit defaults that differ from first operator in list
	const explicitDefaults: Partial<Record<FilterVariant, FilterOperator>> = {
		text: "iLike", // Contains (3rd in list)
		date: "isRelativeToToday", // Is relative to today (7th in list)
		dateRange: "isRelativeToToday",
	};

	const explicit = explicitDefaults[filterVariant];
	if (explicit) {
		return explicit;
	}

	// Otherwise use first operator
	const operators = getFilterOperators(filterVariant);
	return operators[0]?.value ?? "eq";
}

/**
 * Validates that an operator is valid for the given filter variant
 */
export function isValidOperatorForVariant(
	operator: FilterOperator,
	variant: FilterVariant
): boolean {
	const validOperators = getFilterOperators(variant);
	return validOperators.some((op) => op.value === operator);
}
