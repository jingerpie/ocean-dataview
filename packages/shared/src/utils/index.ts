// biome-ignore lint/performance/noBarrelFile: Shared utils public API
export {
	getDefaultFilterCondition,
	getFilterConditions,
	isValidConditionForVariant,
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
export { validateFilter } from "./filter-validation";
export { getFilterVariantFromPropertyType } from "./filter-variant";
export { combineGroupFilter } from "./group-filter";
export { buildSearchFilter } from "./search";
export { validateSort } from "./sort-validation";
