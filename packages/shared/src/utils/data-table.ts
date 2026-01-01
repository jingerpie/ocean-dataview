import { dataTableConfig } from "../config/data-table";
import type {
	FilterOperator,
	FilterVariant,
	PropertyFilter,
} from "../types/data-table.type";

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
	};

	return operatorMap[filterVariant] ?? dataTableConfig.textOperators;
}

export function getDefaultFilterOperator(filterVariant: FilterVariant) {
	const operators = getFilterOperators(filterVariant);

	return operators[0]?.value ?? (filterVariant === "text" ? "iLike" : "eq");
}

/**
 * Validates that an operator is valid for the given filter variant
 */
export function isValidOperatorForVariant(
	operator: FilterOperator,
	variant: FilterVariant,
): boolean {
	const validOperators = getFilterOperators(variant);
	return validOperators.some((op) => op.value === operator);
}

/**
 * Filters out invalid filters (empty values, except for isEmpty/isNotEmpty operators)
 */
export function getValidFilters<TData>(
	filters: PropertyFilter<TData>[],
): PropertyFilter<TData>[] {
	return filters.filter(
		(filter) =>
			filter.operator === "isEmpty" ||
			filter.operator === "isNotEmpty" ||
			(Array.isArray(filter.value)
				? filter.value.length > 0
				: filter.value !== "" &&
					filter.value !== null &&
					filter.value !== undefined),
	);
}
