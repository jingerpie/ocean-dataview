import {
  isWhereExpression,
  isWhereRule,
  type WhereNode,
} from "../types/filter.type";
import type { DataViewProperty, PropertyMeta } from "../types/property.type";

// ============================================================================
// Property Extraction
// ============================================================================

/** Property types that cannot be filtered */
const NON_FILTERABLE_TYPES = new Set(["formula", "button"]);

/** Minimal property shape for validation (works with both DataViewProperty and PropertyMeta) */
type PropertyLike = Pick<PropertyMeta, "enableFilter" | "id" | "type">;

/**
 * Extract filterable property IDs from properties.
 * Excludes formula and button types which aren't filterable.
 * Respects enableFilter: false on individual properties.
 */
function getFilterablePropertyIds(
  properties: readonly PropertyLike[]
): Set<string> {
  return new Set(
    properties
      .filter(
        (p) => !NON_FILTERABLE_TYPES.has(p.type) && p.enableFilter !== false
      )
      .map((p) => p.id)
  );
}

// ============================================================================
// Filter Tree Validation
// ============================================================================

/**
 * Process a single node and return it if valid, null if invalid.
 */
function filterSingleNode(
  node: WhereNode,
  validKeys: Set<string>
): WhereNode | null {
  if (isWhereRule(node)) {
    return validKeys.has(node.property) ? node : null;
  }

  if (!isWhereExpression(node)) {
    return null;
  }

  const items = node.and ?? node.or ?? [];
  const filtered = filterInvalidNodes(items, validKeys);
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
  validKeys: Set<string>
): WhereNode[] | null {
  const result: WhereNode[] = [];

  for (const node of nodes) {
    const filtered = filterSingleNode(node, validKeys);
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
  const validPropertyIds = getFilterablePropertyIds(properties);
  return filterInvalidNodes(filter, validPropertyIds);
}
