import type {
	WhereCondition,
	WhereExpression,
	WhereNode,
} from "../types/data-table.type";
import { isWhereCondition, isWhereExpression } from "../types/data-table.type";

// ============================================================================
// Basic Helpers
// ============================================================================

/**
 * Get the items array from a where expression
 */
export function getFilterItems(expr: WhereExpression): WhereNode[] {
	return expr.and ?? expr.or ?? [];
}

/**
 * Get the logic type of a where expression
 */
export function getFilterLogic(expr: WhereExpression): "and" | "or" {
	return expr.and ? "and" : "or";
}

/**
 * Create a new where expression with the given logic and items
 */
export function createCompoundFilter(
	logic: "and" | "or",
	items: WhereNode[]
): WhereExpression {
	return logic === "and" ? { and: items } : { or: items };
}

/**
 * Create a default where condition
 */
export function createDefaultCondition(
	property: string,
	operator: WhereCondition["operator"] = "eq"
): WhereCondition {
	return { property, operator };
}

// ============================================================================
// Normalization
// ============================================================================

/**
 * Normalize a filter to always be a where expression (or null)
 * Wraps single conditions in an AND group
 */
export function normalizeFilter(
	filter: WhereNode | null | undefined
): WhereExpression | null {
	if (!filter) {
		return null;
	}
	if (isWhereCondition(filter)) {
		return { and: [filter] };
	}
	return filter;
}

// ============================================================================
// Filter Analysis (for chip display)
// ============================================================================

export interface FilterAnalysis {
	/** Simple conditions at root level (displayed as FilterChip) */
	simpleConditions: Array<{ condition: WhereCondition; index: number }>;
	/** First WhereExpression at root level (displayed as AdvancedFilterChip) */
	advancedFilter: WhereExpression | null;
	/** Index of advancedFilter in root array */
	advancedFilterIndex: number | null;
	/** Whether the filter structure needs normalization */
	needsNormalization: boolean;
	/** Total count of rules (for advanced filter chip display) */
	ruleCount: number;
}

/**
 * Count total rules in a filter (recursive)
 */
function countRules(node: WhereNode): number {
	if (isWhereCondition(node)) {
		return 1;
	}
	if (isWhereExpression(node)) {
		const items = getFilterItems(node);
		return items.reduce((sum, item) => sum + countRules(item), 0);
	}
	return 0;
}

/**
 * Analyze a filter to separate simple conditions from advanced filter.
 *
 * Root level is always { and: [...] }
 * - Simple filters (chips) = WhereCondition items at root
 * - Advanced filter = WhereExpression item at root (first one found)
 * - Both can coexist, combined with AND logic
 */
export function analyzeFilter(filter: WhereNode | null): FilterAnalysis {
	// Empty filter
	if (!filter) {
		return {
			simpleConditions: [],
			advancedFilter: null,
			advancedFilterIndex: null,
			needsNormalization: false,
			ruleCount: 0,
		};
	}

	// Single condition (legacy/simple case) - treat as simple
	if (isWhereCondition(filter)) {
		return {
			simpleConditions: [{ condition: filter, index: 0 }],
			advancedFilter: null,
			advancedFilterIndex: null,
			needsNormalization: true, // Should wrap in { and: [...] }
			ruleCount: 1,
		};
	}

	// OR at root (invalid for simple UI) - treat as advanced
	if ("or" in filter && !("and" in filter)) {
		return {
			simpleConditions: [],
			advancedFilter: filter,
			advancedFilterIndex: 0,
			needsNormalization: true, // Should wrap in { and: [filter] }
			ruleCount: countRules(filter),
		};
	}

	// Normal AND at root
	const items = filter.and ?? [];
	const simpleConditions: Array<{ condition: WhereCondition; index: number }> =
		[];
	let advancedFilter: WhereExpression | null = null;
	let advancedFilterIndex: number | null = null;
	let compoundCount = 0;

	for (const [index, item] of items.entries()) {
		if (isWhereCondition(item)) {
			simpleConditions.push({ condition: item, index });
		} else if (isWhereExpression(item)) {
			compoundCount++;
			if (!advancedFilter) {
				advancedFilter = item;
				advancedFilterIndex = index;
			}
		}
	}

	return {
		simpleConditions,
		advancedFilter,
		advancedFilterIndex,
		needsNormalization: compoundCount > 1, // Multiple compounds need merging
		ruleCount: advancedFilter ? countRules(advancedFilter) : 0,
	};
}

/**
 * Normalize filter structure to ensure consistent { and: [...] } root.
 * Called on save/modify to ensure consistent structure.
 */
export function normalizeFilterStructure(
	filter: WhereNode | null
): WhereExpression | null {
	if (!filter) {
		return null;
	}

	// Single condition → wrap in { and: [...] }
	if (isWhereCondition(filter)) {
		return { and: [filter] };
	}

	// OR at root → wrap in { and: [...] }
	if ("or" in filter && !("and" in filter)) {
		return { and: [filter] };
	}

	// Multiple WhereExpressions at root → merge into first
	const items = filter.and ?? [];
	const compounds = items.filter(isWhereExpression);
	const conditions = items.filter(isWhereCondition);

	if (compounds.length <= 1) {
		return filter as WhereExpression;
	}

	// Merge all compounds into one (preserve first's logic)
	const firstCompound = compounds[0];
	if (!firstCompound) {
		return filter as WhereExpression;
	}
	const firstLogic = "and" in firstCompound ? "and" : "or";
	const mergedItems = compounds.flatMap((c) => c.and ?? c.or ?? []);
	const mergedAdvanced: WhereExpression =
		firstLogic === "and" ? { and: mergedItems } : { or: mergedItems };

	return { and: [mergedAdvanced, ...conditions] };
}

// ============================================================================
// Flattening (for chip display)
// ============================================================================

export interface FlattenedCondition {
	condition: WhereCondition;
	path: number[];
	parentLogic: "and" | "or";
	depth: number;
}

/**
 * Flatten a filter tree to get all conditions with their paths
 */
export function flattenFilter(
	filter: WhereNode | null | undefined,
	parentPath = [] as number[],
	parentLogic = "and" as "and" | "or",
	depth = 0
): FlattenedCondition[] {
	if (!filter) {
		return [];
	}

	if (isWhereCondition(filter)) {
		return [{ condition: filter, path: parentPath, parentLogic, depth }];
	}

	const logic = getFilterLogic(filter);
	const items = getFilterItems(filter);
	const result: FlattenedCondition[] = [];

	items.forEach((item, index) => {
		const itemPath = [...parentPath, index];
		if (isWhereCondition(item)) {
			result.push({
				condition: item,
				path: itemPath,
				parentLogic: logic,
				depth,
			});
		} else {
			// Recurse into nested group
			result.push(...flattenFilter(item, itemPath, logic, depth + 1));
		}
	});

	return result;
}

// ============================================================================
// Path-Based Navigation
// ============================================================================

/**
 * Get an item at a specific path in the filter tree
 */
export function getItemAtPath(
	expr: WhereExpression,
	path: number[]
): WhereNode | null {
	if (path.length === 0) {
		return expr;
	}

	const items = getFilterItems(expr);
	const [index, ...rest] = path;

	if (index === undefined || index >= items.length) {
		return null;
	}

	const item = items[index];
	if (!item) {
		return null;
	}

	if (rest.length === 0) {
		return item;
	}

	if (isWhereExpression(item)) {
		return getItemAtPath(item, rest);
	}

	return null;
}

/**
 * Update an item at a specific path in the filter tree (immutable)
 * Preserves empty compound filters (returns { and: [] } or { or: [] } instead of null)
 * This allows advanced filter chips to remain visible even when all rules are deleted
 */
function updateItemAtPath(
	expr: WhereExpression,
	path: number[],
	updater: (item: WhereNode) => WhereNode | null
): WhereExpression {
	const logic = getFilterLogic(expr);
	const items = [...getFilterItems(expr)];

	if (path.length === 0) {
		// Can't update root with this function
		return expr;
	}

	const [index, ...rest] = path;

	if (index === undefined || index >= items.length) {
		return expr;
	}

	if (rest.length === 0) {
		// Update this item
		const current = items[index];
		if (!current) {
			return expr;
		}

		const updated = updater(current);
		if (updated === null) {
			// Remove the item
			items.splice(index, 1);
		} else {
			items[index] = updated;
		}
	} else {
		// Recurse into nested compound filter
		const current = items[index];
		if (!(current && isWhereExpression(current))) {
			return expr;
		}

		const updated = updateItemAtPath(current, rest, updater);
		// Preserve empty compound filters (don't remove them)
		items[index] = updated;
	}

	// Return compound filter even if empty (preserve structure)
	return createCompoundFilter(logic, items);
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Add a condition to a where expression at a specific path
 * Path [] means add to root level
 */
export function addCondition(
	expr: WhereExpression,
	path: number[],
	condition: WhereCondition
): WhereExpression {
	if (path.length === 0) {
		// Add to root
		const logic = getFilterLogic(expr);
		const items = [...getFilterItems(expr), condition];
		return createCompoundFilter(logic, items);
	}

	// Find the group at path and add to it
	const logic = getFilterLogic(expr);
	const items = [...getFilterItems(expr)];
	const [index, ...rest] = path;

	if (index === undefined || index >= items.length) {
		return expr;
	}

	const current = items[index];
	if (!(current && isWhereExpression(current))) {
		return expr;
	}

	items[index] = addCondition(current, rest, condition);
	return createCompoundFilter(logic, items);
}

/**
 * Add a nested group at a specific path
 * The new group starts with one default condition
 */
export function addGroup(
	expr: WhereExpression,
	path: number[],
	groupLogic: "and" | "or" = "and",
	defaultProperty?: string
): WhereExpression {
	// Create new group with one placeholder condition
	const defaultCondition = createDefaultCondition(defaultProperty ?? "", "eq");
	const newGroup = createCompoundFilter(groupLogic, [defaultCondition]);

	if (path.length === 0) {
		// Add to root
		const logic = getFilterLogic(expr);
		const items = [...getFilterItems(expr), newGroup];
		return createCompoundFilter(logic, items);
	}

	const logic = getFilterLogic(expr);
	const items = [...getFilterItems(expr)];
	const [index, ...rest] = path;

	if (index === undefined || index >= items.length) {
		return expr;
	}

	const current = items[index];
	if (!(current && isWhereExpression(current))) {
		return expr;
	}

	items[index] = addGroup(current, rest, groupLogic, defaultProperty);
	return createCompoundFilter(logic, items);
}

/**
 * Update a condition at a specific path
 */
export function updateCondition(
	expr: WhereExpression,
	path: number[],
	condition: WhereCondition
): WhereExpression {
	return updateItemAtPath(expr, path, () => condition);
}

/**
 * Remove an item (condition or group) at a specific path
 * Preserves empty compound filter structure (returns { and: [] } instead of null)
 */
export function removeItem(
	expr: WhereExpression,
	path: number[]
): WhereExpression {
	return updateItemAtPath(expr, path, () => null);
}

/**
 * Duplicate an item at a specific path
 * The duplicate is inserted immediately after the original
 */
export function duplicateItem(
	expr: WhereExpression,
	path: number[]
): WhereExpression {
	if (path.length === 0) {
		return expr;
	}

	const parentPath = path.slice(0, -1);
	const itemIndex = path.at(-1);

	if (itemIndex === undefined) {
		return expr;
	}

	// Get the parent group
	const parent =
		parentPath.length === 0 ? expr : getItemAtPath(expr, parentPath);

	if (!(parent && isWhereExpression(parent))) {
		return expr;
	}

	const parentLogic = getFilterLogic(parent);
	const parentItems = getFilterItems(parent);
	const itemToDuplicate = parentItems[itemIndex];

	if (!itemToDuplicate) {
		return expr;
	}

	// Deep clone the item
	const clonedItem = JSON.parse(JSON.stringify(itemToDuplicate)) as WhereNode;

	// Insert after the original
	const newItems = [...parentItems];
	newItems.splice(itemIndex + 1, 0, clonedItem);

	const newParent = createCompoundFilter(parentLogic, newItems);

	// If at root, return the new parent directly
	if (parentPath.length === 0) {
		return newParent;
	}

	// Otherwise, update the parent in the tree
	return updateItemAtPath(expr, parentPath, () => newParent);
}

/**
 * Wrap an item in a new group at a specific path
 */
export function wrapInGroup(
	expr: WhereExpression,
	path: number[],
	groupLogic: "and" | "or" = "and"
): WhereExpression {
	const item = getItemAtPath(expr, path);
	if (!item) {
		return expr;
	}

	// Create a new group containing just this item
	const newGroup = createCompoundFilter(groupLogic, [item]);

	// Replace the item with the new group
	return updateItemAtPath(expr, path, () => newGroup);
}

/**
 * Change logic operator for the root or a group at path
 */
export function changeLogic(
	expr: WhereExpression,
	path: number[],
	logic: "and" | "or"
): WhereExpression {
	if (path.length === 0) {
		// Change root logic
		const items = getFilterItems(expr);
		return createCompoundFilter(logic, items);
	}

	return updateItemAtPath(expr, path, (item) => {
		if (isWhereExpression(item)) {
			return createCompoundFilter(logic, getFilterItems(item));
		}
		return item;
	});
}

// ============================================================================
// Depth Utilities
// ============================================================================

/**
 * Calculate the nesting depth at a specific path
 * Returns how many group levels deep we are
 */
export function getDepthAtPath(expr: WhereExpression, path: number[]): number {
	let depth = 0;
	let current: WhereNode = expr;

	for (const index of path) {
		if (!isWhereExpression(current)) {
			break;
		}
		const items = getFilterItems(current);
		const item = items[index];
		if (!item) {
			break;
		}

		if (isWhereExpression(item)) {
			depth++;
		}
		current = item;
	}

	return depth;
}

/**
 * Check if a group at path can have more nested groups (max depth = 2)
 */
export function canAddGroupAtPath(
	expr: WhereExpression,
	path: number[]
): boolean {
	// Count how many group levels we're already in
	let groupDepth = 0;
	let current: WhereNode = expr;

	for (const index of path) {
		if (!isWhereExpression(current)) {
			break;
		}
		groupDepth++; // We're entering a group
		const items = getFilterItems(current);
		const item = items[index];
		if (!item) {
			break;
		}
		current = item;
	}

	// If current is also a compound filter, we're inside it
	if (path.length === 0) {
		groupDepth = 0; // Root level
	}

	// Max 2 levels of nesting (level 0, 1, 2)
	return groupDepth < 2;
}

// ============================================================================
// Display Helpers
// ============================================================================

/**
 * Get a human-readable summary of a where condition
 */
export function getConditionSummary(
	condition: WhereCondition,
	propertyLabel?: string
): string {
	const prop = propertyLabel ?? condition.property;
	const op = condition.operator;

	// Handle operators without values
	if (op === "isEmpty") {
		return `${prop} is empty`;
	}
	if (op === "isNotEmpty") {
		return `${prop} is not empty`;
	}

	// Format value
	const value = condition.value;
	const valueStr = (() => {
		if (value === undefined) {
			return "";
		}
		if (Array.isArray(value)) {
			return value.join(", ");
		}
		return String(value);
	})();

	// Operator labels
	const opLabels: Record<string, string> = {
		eq: "is",
		ne: "is not",
		iLike: "contains",
		notILike: "does not contain",
		startsWith: "starts with",
		endsWith: "ends with",
		gt: ">",
		gte: "≥",
		lt: "<",
		lte: "≤",
		inArray: "contains",
		notInArray: "does not contain",
		isBetween: "is between",
		isRelativeToToday: "is relative to today",
	};

	const opLabel = opLabels[op] ?? op;
	return `${prop} ${opLabel} ${valueStr}`.trim();
}
