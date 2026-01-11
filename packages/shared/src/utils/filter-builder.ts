import type {
	CompoundFilter,
	Filter,
	FilterCondition,
} from "../types/data-table.type";
import { isCompoundFilter, isFilterCondition } from "../types/data-table.type";

// ============================================================================
// Basic Helpers
// ============================================================================

/**
 * Get the items array from a compound filter
 */
export function getFilterItems(filter: CompoundFilter): Filter[] {
	return filter.and ?? filter.or ?? [];
}

/**
 * Get the logic type of a compound filter
 */
export function getFilterLogic(filter: CompoundFilter): "and" | "or" {
	return filter.and ? "and" : "or";
}

/**
 * Create a new compound filter with the given logic and items
 */
export function createCompoundFilter(
	logic: "and" | "or",
	items: Filter[],
): CompoundFilter {
	return logic === "and" ? { and: items } : { or: items };
}

/**
 * Create a default filter condition
 */
export function createDefaultCondition(
	property: string,
	operator: FilterCondition["operator"] = "eq",
): FilterCondition {
	return { property, operator };
}

// ============================================================================
// Normalization
// ============================================================================

/**
 * Normalize a filter to always be a compound filter (or null)
 * Wraps single conditions in an AND group
 */
export function normalizeFilter(
	filter: Filter | null | undefined,
): CompoundFilter | null {
	if (!filter) return null;
	if (isFilterCondition(filter)) {
		return { and: [filter] };
	}
	return filter;
}

// ============================================================================
// Flattening (for chip display)
// ============================================================================

export interface FlattenedCondition {
	condition: FilterCondition;
	path: number[];
	parentLogic: "and" | "or";
	depth: number;
}

/**
 * Flatten a filter tree to get all conditions with their paths
 */
export function flattenFilter(
	filter: Filter | null | undefined,
	parentPath = [] as number[],
	parentLogic = "and" as "and" | "or",
	depth = 0,
): FlattenedCondition[] {
	if (!filter) return [];

	if (isFilterCondition(filter)) {
		return [{ condition: filter, path: parentPath, parentLogic, depth }];
	}

	const logic = getFilterLogic(filter);
	const items = getFilterItems(filter);
	const result: FlattenedCondition[] = [];

	items.forEach((item, index) => {
		const itemPath = [...parentPath, index];
		if (isFilterCondition(item)) {
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
	filter: CompoundFilter,
	path: number[],
): Filter | null {
	if (path.length === 0) return filter;

	const items = getFilterItems(filter);
	const [index, ...rest] = path;

	if (index === undefined || index >= items.length) return null;

	const item = items[index];
	if (!item) return null;

	if (rest.length === 0) return item;

	if (isCompoundFilter(item)) {
		return getItemAtPath(item, rest);
	}

	return null;
}

/**
 * Update an item at a specific path in the filter tree (immutable)
 * Returns null if the filter becomes empty after the update
 */
function updateItemAtPath(
	filter: CompoundFilter,
	path: number[],
	updater: (item: Filter) => Filter | null,
): CompoundFilter | null {
	const logic = getFilterLogic(filter);
	const items = [...getFilterItems(filter)];

	if (path.length === 0) {
		// Can't update root with this function
		return filter;
	}

	const [index, ...rest] = path;

	if (index === undefined || index >= items.length) return filter;

	if (rest.length === 0) {
		// Update this item
		const current = items[index];
		if (!current) return filter;

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
		if (!current || !isCompoundFilter(current)) return filter;

		const updated = updateItemAtPath(current, rest, updater);
		if (updated === null || getFilterItems(updated).length === 0) {
			// Remove empty group
			items.splice(index, 1);
		} else {
			items[index] = updated;
		}
	}

	// If no items left, return null to signal removal
	if (items.length === 0) return null;

	return createCompoundFilter(logic, items);
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Add a condition to a compound filter at a specific path
 * Path [] means add to root level
 */
export function addCondition(
	filter: CompoundFilter,
	path: number[],
	condition: FilterCondition,
): CompoundFilter {
	if (path.length === 0) {
		// Add to root
		const logic = getFilterLogic(filter);
		const items = [...getFilterItems(filter), condition];
		return createCompoundFilter(logic, items);
	}

	// Find the group at path and add to it
	const logic = getFilterLogic(filter);
	const items = [...getFilterItems(filter)];
	const [index, ...rest] = path;

	if (index === undefined || index >= items.length) return filter;

	const current = items[index];
	if (!current || !isCompoundFilter(current)) return filter;

	items[index] = addCondition(current, rest, condition);
	return createCompoundFilter(logic, items);
}

/**
 * Add a nested group at a specific path
 * The new group starts with one default condition
 */
export function addGroup(
	filter: CompoundFilter,
	path: number[],
	groupLogic: "and" | "or" = "and",
	defaultProperty?: string,
): CompoundFilter {
	// Create new group with one placeholder condition
	const defaultCondition = createDefaultCondition(defaultProperty ?? "", "eq");
	const newGroup = createCompoundFilter(groupLogic, [defaultCondition]);

	if (path.length === 0) {
		// Add to root
		const logic = getFilterLogic(filter);
		const items = [...getFilterItems(filter), newGroup];
		return createCompoundFilter(logic, items);
	}

	const logic = getFilterLogic(filter);
	const items = [...getFilterItems(filter)];
	const [index, ...rest] = path;

	if (index === undefined || index >= items.length) return filter;

	const current = items[index];
	if (!current || !isCompoundFilter(current)) return filter;

	items[index] = addGroup(current, rest, groupLogic, defaultProperty);
	return createCompoundFilter(logic, items);
}

/**
 * Update a condition at a specific path
 */
export function updateCondition(
	filter: CompoundFilter,
	path: number[],
	condition: FilterCondition,
): CompoundFilter {
	const result = updateItemAtPath(filter, path, () => condition);
	return result ?? createCompoundFilter("and", []);
}

/**
 * Remove an item (condition or group) at a specific path
 * Returns null if the filter becomes empty
 */
export function removeItem(
	filter: CompoundFilter,
	path: number[],
): CompoundFilter | null {
	return updateItemAtPath(filter, path, () => null);
}

/**
 * Duplicate an item at a specific path
 * The duplicate is inserted immediately after the original
 */
export function duplicateItem(
	filter: CompoundFilter,
	path: number[],
): CompoundFilter {
	if (path.length === 0) return filter;

	const parentPath = path.slice(0, -1);
	const itemIndex = path[path.length - 1];

	if (itemIndex === undefined) return filter;

	// Get the parent group
	const parent =
		parentPath.length === 0 ? filter : getItemAtPath(filter, parentPath);

	if (!parent || !isCompoundFilter(parent)) return filter;

	const parentLogic = getFilterLogic(parent);
	const parentItems = getFilterItems(parent);
	const itemToDuplicate = parentItems[itemIndex];

	if (!itemToDuplicate) return filter;

	// Deep clone the item
	const clonedItem = JSON.parse(JSON.stringify(itemToDuplicate)) as Filter;

	// Insert after the original
	const newItems = [...parentItems];
	newItems.splice(itemIndex + 1, 0, clonedItem);

	const newParent = createCompoundFilter(parentLogic, newItems);

	// If at root, return the new parent directly
	if (parentPath.length === 0) {
		return newParent;
	}

	// Otherwise, update the parent in the tree
	const result = updateItemAtPath(filter, parentPath, () => newParent);
	return result ?? filter;
}

/**
 * Wrap an item in a new group at a specific path
 */
export function wrapInGroup(
	filter: CompoundFilter,
	path: number[],
	groupLogic: "and" | "or" = "and",
): CompoundFilter {
	const item = getItemAtPath(filter, path);
	if (!item) return filter;

	// Create a new group containing just this item
	const newGroup = createCompoundFilter(groupLogic, [item]);

	// Replace the item with the new group
	const result = updateItemAtPath(filter, path, () => newGroup);
	return result ?? filter;
}

/**
 * Change logic operator for the root or a group at path
 */
export function changeLogic(
	filter: CompoundFilter,
	path: number[],
	logic: "and" | "or",
): CompoundFilter {
	if (path.length === 0) {
		// Change root logic
		const items = getFilterItems(filter);
		return createCompoundFilter(logic, items);
	}

	const result = updateItemAtPath(filter, path, (item) => {
		if (isCompoundFilter(item)) {
			return createCompoundFilter(logic, getFilterItems(item));
		}
		return item;
	});

	return result ?? createCompoundFilter("and", []);
}

// ============================================================================
// Depth Utilities
// ============================================================================

/**
 * Calculate the nesting depth at a specific path
 * Returns how many group levels deep we are
 */
export function getDepthAtPath(filter: CompoundFilter, path: number[]): number {
	let depth = 0;
	let current: Filter = filter;

	for (const index of path) {
		if (!isCompoundFilter(current)) break;
		const items = getFilterItems(current);
		const item = items[index];
		if (!item) break;

		if (isCompoundFilter(item)) {
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
	filter: CompoundFilter,
	path: number[],
): boolean {
	// Count how many group levels we're already in
	let groupDepth = 0;
	let current: Filter = filter;

	for (const index of path) {
		if (!isCompoundFilter(current)) break;
		groupDepth++; // We're entering a group
		const items = getFilterItems(current);
		const item = items[index];
		if (!item) break;
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
 * Get a human-readable summary of a filter condition
 */
export function getConditionSummary(
	condition: FilterCondition,
	propertyLabel?: string,
): string {
	const prop = propertyLabel ?? condition.property;
	const op = condition.operator;

	// Handle operators without values
	if (op === "isEmpty") return `${prop} is empty`;
	if (op === "isNotEmpty") return `${prop} is not empty`;

	// Format value
	const value = condition.value;
	const valueStr =
		value === undefined
			? ""
			: Array.isArray(value)
				? value.join(", ")
				: String(value);

	// Operator labels
	const opLabels: Record<string, string> = {
		eq: "is",
		ne: "is not",
		iLike: "contains",
		notILike: "does not contain",
		gt: ">",
		gte: ">=",
		lt: "<",
		lte: "<=",
		inArray: "is any of",
		notInArray: "is none of",
		isBetween: "is between",
		isRelativeToToday: "is relative to today",
	};

	const opLabel = opLabels[op] ?? op;
	return `${prop} ${opLabel} ${valueStr}`.trim();
}
