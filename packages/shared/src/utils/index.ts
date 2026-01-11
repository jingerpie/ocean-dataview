export {
	getDefaultFilterOperator,
	getFilterOperators,
	isValidOperatorForVariant,
} from "./filter";

export {
	// Mutations
	addCondition,
	addGroup,
	canAddGroupAtPath,
	changeLogic,
	createCompoundFilter,
	createDefaultCondition,
	duplicateItem,
	type FlattenedCondition,
	// Flattening
	flattenFilter,
	// Display helpers
	getConditionSummary,
	// Depth utilities
	getDepthAtPath,
	// Basic helpers
	getFilterItems,
	getFilterLogic,
	// Path navigation
	getItemAtPath,
	// Normalization
	normalizeFilter,
	removeItem,
	updateCondition,
	wrapInGroup,
} from "./filter-builder";
