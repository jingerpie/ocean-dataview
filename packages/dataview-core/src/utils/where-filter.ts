import {
  isWhereExpression,
  isWhereRule,
  type WhereNode,
} from "../types/filter.type";

/**
 * Collects all property ids referenced by rules anywhere in a filter tree.
 */
export function collectFilterProperties(
  nodes: readonly WhereNode[],
  into: Set<string> = new Set()
): Set<string> {
  for (const node of nodes) {
    if (isWhereRule(node)) {
      into.add(node.property);
    } else if (isWhereExpression(node)) {
      collectFilterProperties(node.and ?? node.or ?? [], into);
    }
  }
  return into;
}

function removePropertiesFromNode(
  node: WhereNode,
  propertyIds: ReadonlySet<string>
): WhereNode | null {
  if (isWhereRule(node)) {
    return propertyIds.has(node.property) ? null : node;
  }
  if (!isWhereExpression(node)) {
    return null;
  }
  const children = (node.and ?? node.or ?? [])
    .map((child) => removePropertiesFromNode(child, propertyIds))
    .filter((child): child is WhereNode => child !== null);
  if (children.length === 0) {
    return null;
  }
  return node.and ? { and: children } : { or: children };
}

/**
 * Removes every rule referencing one of `propertyIds` from a filter tree,
 * pruning and/or groups left empty. Pure counterpart of
 * useFilterParams().removeFilter.
 */
export function removePropertiesFromFilter(
  nodes: readonly WhereNode[],
  propertyIds: ReadonlySet<string>
): WhereNode[] {
  return nodes
    .map((node) => removePropertiesFromNode(node, propertyIds))
    .filter((node): node is WhereNode => node !== null);
}

/**
 * Extracts the top-level nodes whose referenced properties are all in
 * `propertyIds`. Nodes referencing no properties, or mixing owned and
 * foreign properties, are excluded. Inverse of removePropertiesFromFilter
 * for well-formed preset nodes.
 */
export function extractPropertiesFromFilter(
  nodes: readonly WhereNode[],
  propertyIds: ReadonlySet<string>
): WhereNode[] {
  return nodes.filter((node) => {
    const referenced = collectFilterProperties([node]);
    if (referenced.size === 0) {
      return false;
    }
    for (const property of referenced) {
      if (!propertyIds.has(property)) {
        return false;
      }
    }
    return true;
  });
}
