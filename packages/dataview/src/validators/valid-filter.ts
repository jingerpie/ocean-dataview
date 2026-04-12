import {
  isWhereExpression,
  isWhereRule,
  type WhereNode,
} from "../types/filter.type";
import {
  type DataViewProperty,
  getEffectiveType,
  isDisplayRollup,
  type PropertyMeta,
} from "../types/property.type";
import { isValidConditionForPropertyType } from "../utils/filter";

// ============================================================================
// Property Extraction
// ============================================================================

/** Property types that cannot be filtered */
const NON_FILTERABLE_TYPES = new Set(["formula", "button"]);

/** Minimal property shape for validation (works with both DataViewProperty and PropertyMeta) */
type PropertyLike = Pick<
  PropertyMeta,
  "config" | "enableFilter" | "id" | "type"
>;

/**
 * Extract filterable properties as a map of id -> type.
 * Excludes formula and button types which aren't filterable.
 * Respects enableFilter: false on individual properties.
 */
function getFilterablePropertyMap(
  properties: readonly PropertyLike[]
): Map<string, PropertyLike> {
  const map = new Map<string, PropertyLike>();
  for (const p of properties) {
    if (!NON_FILTERABLE_TYPES.has(p.type) && p.enableFilter !== false) {
      map.set(p.id, p);
    }
  }
  return map;
}

/**
 * Extract display rollup property IDs (showOriginal / showUnique).
 * These require a quantifier (any/none/every) when used in filters.
 */
function getDisplayRollupIds(properties: readonly PropertyLike[]): Set<string> {
  return new Set(
    properties
      .filter((p) => isDisplayRollup(p as PropertyMeta))
      .map((p) => p.id)
  );
}

// ============================================================================
// Filter Tree Validation
// ============================================================================

/**
 * Process a single node and return it if valid, null if invalid.
 * Validates: property exists, condition is valid for property type,
 * and display rollup properties require a quantifier.
 */
function filterSingleNode(
  node: WhereNode,
  propertyMap: Map<string, PropertyLike>,
  rollupKeys: Set<string>
): WhereNode | null {
  if (isWhereRule(node)) {
    const property = propertyMap.get(node.property);
    if (!property) {
      return null;
    }
    const effectiveType = getEffectiveType(property as PropertyMeta);
    if (!isValidConditionForPropertyType(node.condition, effectiveType)) {
      return null;
    }
    if (rollupKeys.has(node.property) && !node.quantifier) {
      return null;
    }
    return node;
  }

  if (!isWhereExpression(node)) {
    return null;
  }

  const items = node.and ?? node.or ?? [];
  const filtered = filterInvalidNodes(items, propertyMap, rollupKeys);
  if (!filtered || filtered.length === 0) {
    return null;
  }

  return node.and ? { and: filtered } : { or: filtered };
}

/**
 * Recursively filter out invalid nodes from filter tree.
 * Invalid rules are removed, empty and/or branches are pruned.
 * Returns null if the entire tree is invalid.
 */
function filterInvalidNodes(
  nodes: WhereNode[],
  propertyMap: Map<string, PropertyLike>,
  rollupKeys: Set<string>
): WhereNode[] | null {
  const result: WhereNode[] = [];

  for (const node of nodes) {
    const filtered = filterSingleNode(node, propertyMap, rollupKeys);
    if (filtered) {
      result.push(filtered);
    }
  }

  return result.length > 0 ? result : null;
}

// ============================================================================
// Pure Validation Function
// ============================================================================

/**
 * Validate filter against property schema.
 * Filters out rules referencing invalid properties.
 * Returns null when all rules are invalid (so url ?? defaults still works).
 *
 * Accepts both DataViewProperty[] and PropertyMeta[] for flexibility.
 *
 * @example
 * ```ts
 * const filter = parseAsFilter(url);
 * const validatedFilter = validateFilter(filter, productProperties);
 * ```
 */
export function validateFilter<T>(
  filter: WhereNode[] | null,
  properties: readonly DataViewProperty<T>[] | readonly PropertyMeta[]
): WhereNode[] | null {
  if (!filter) {
    return null;
  }
  const propertyMap = getFilterablePropertyMap(properties);
  const rollupIds = getDisplayRollupIds(properties);
  return filterInvalidNodes(filter, propertyMap, rollupIds);
}
