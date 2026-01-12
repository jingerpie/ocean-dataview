export {
	getDefaultFilterOperator,
	getFilterOperators,
	isValidOperatorForVariant,
} from "./filter";
export {
	// Mutations
	addCondition,
	addGroup,
	// Filter Analysis (for chip display)
	analyzeFilter,
	canAddGroupAtPath,
	changeLogic,
	createCompoundFilter,
	createDefaultCondition,
	duplicateItem,
	type FilterAnalysis,
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
	normalizeFilterStructure,
	removeItem,
	updateCondition,
	wrapInGroup,
} from "./filter-builder";
export { getFilterVariantFromPropertyType } from "./filter-variant";
