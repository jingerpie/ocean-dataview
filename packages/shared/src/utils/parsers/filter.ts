import { createParser } from "nuqs/server";
import {
  isWhereExpression,
  isWhereRule,
  type WhereNode,
  type WhereRule,
} from "../../types/filter.type";
import {
  decodeArrayValue,
  matchExpression,
  parsePrimitive,
  splitRespectingParens,
} from "../url-dsl/decoder";
import {
  encodeArrayValue,
  encodePrimitive,
  encodeTuple,
} from "../url-dsl/encoder";

// ============================================================================
// DSL Format
// ============================================================================
// Rule: property.condition[.value]
// Array value: property.condition.(value1,value2,value3)
// Expression: and(rule1,rule2) or or(rule1,rule2)
// Top-level: rule1,rule2,and(rule3,rule4)

// ============================================================================
// Encoder
// ============================================================================

/**
 * Encode a filter rule to DSL format.
 * Example: { property: "name", condition: "eq", value: "test" } → "name.eq.test"
 * Example: { property: "status", condition: "isAnyOf", value: ["a", "b"] } → "status.isAnyOf.(a,b)"
 */
function encodeRule(rule: WhereRule): string {
  const baseParts = [
    encodePrimitive(rule.property),
    encodePrimitive(rule.condition),
  ];

  if (rule.value === undefined || rule.value === null) {
    return baseParts.join(".");
  }

  const value = rule.value;

  // Handle array values with parentheses wrapper
  if (Array.isArray(value)) {
    const arrayStr = encodeArrayValue(value as (string | number | boolean)[]);
    return `${baseParts.join(".")}.${arrayStr}`;
  }

  // Handle primitive values
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return encodeTuple([rule.property, rule.condition, value]);
  }

  // Fallback: serialize to JSON string for complex objects
  return encodeTuple([rule.property, rule.condition, JSON.stringify(value)]);
}

/**
 * Encode a filter node (rule or expression) to DSL format.
 */
function encodeNode(node: WhereNode): string {
  if (isWhereRule(node)) {
    return encodeRule(node);
  }

  if (isWhereExpression(node)) {
    if (node.and) {
      const items = node.and.map(encodeNode).join(",");
      return `and(${items})`;
    }
    if (node.or) {
      const items = node.or.map(encodeNode).join(",");
      return `or(${items})`;
    }
  }

  return "";
}

/**
 * Encode filter array to DSL format.
 * Example: [rule1, rule2] → "rule1,rule2"
 */
export function encodeFilter(filter: WhereNode[]): string {
  if (filter.length === 0) {
    return "";
  }
  return filter.map(encodeNode).join(",");
}

// ============================================================================
// Decoder
// ============================================================================

/**
 * Decode a filter rule from DSL format.
 * Example: "name.eq.test" → { property: "name", condition: "eq", value: "test" }
 * Example: "status.isAnyOf.(a,b)" → { property: "status", condition: "isAnyOf", value: ["a", "b"] }
 */
function decodeRule(value: string): WhereRule | null {
  // Find the first two dot-separated parts (property and condition)
  // Then handle the rest as value (which may contain array syntax)
  const firstDot = value.indexOf(".");
  if (firstDot === -1) {
    return null;
  }

  const property = value.slice(0, firstDot);
  const afterProperty = value.slice(firstDot + 1);

  const secondDot = afterProperty.indexOf(".");
  if (secondDot === -1) {
    // Only property.condition, no value
    const condition = afterProperty;
    if (!(property && condition)) {
      return null;
    }
    return { property, condition } as WhereRule;
  }

  const condition = afterProperty.slice(0, secondDot);
  const valueStr = afterProperty.slice(secondDot + 1);

  if (!(property && condition)) {
    return null;
  }

  // Check if value is an array (wrapped in parentheses)
  if (valueStr.startsWith("(") && valueStr.endsWith(")")) {
    const arrayValue = decodeArrayValue(valueStr);
    if (arrayValue !== null) {
      return { property, condition, value: arrayValue } as WhereRule;
    }
  }

  // Parse as primitive value
  const parsedValue = parsePrimitive(valueStr);
  return { property, condition, value: parsedValue } as WhereRule;
}

/**
 * Decode a filter node (rule or expression) from DSL format.
 */
function decodeNode(value: string): WhereNode | null {
  const expr = matchExpression(value);

  if (expr) {
    const items = splitRespectingParens(expr.content, ",");
    const parsed = items
      .map(decodeNode)
      .filter((n): n is WhereNode => n !== null);

    if (expr.type === "and") {
      return { and: parsed };
    }
    return { or: parsed };
  }

  // It's a rule
  return decodeRule(value);
}

/**
 * Decode filter array from DSL format.
 * Example: "name.eq.test,and(status.eq.active)" → [rule, expression]
 */
export function decodeFilter(value: string): WhereNode[] | null {
  if (!value) {
    return null;
  }

  const items = splitRespectingParens(value, ",");
  const result = items
    .map(decodeNode)
    .filter((n): n is WhereNode => n !== null);

  return result.length > 0 ? result : null;
}

// ============================================================================
// Legacy JSON Support (for migration)
// ============================================================================

function isLegacyFormat(value: string): boolean {
  return value.startsWith("[");
}

/**
 * Transform legacy URL node to code node.
 */
function transformLegacyNode(node: unknown): WhereNode | null {
  // Rule: positional array [property, condition, value?]
  if (Array.isArray(node)) {
    const [property, condition, value] = node;

    if (typeof property !== "string" || !property) {
      return null;
    }
    if (typeof condition !== "string") {
      return null;
    }

    return { property, condition, value } as WhereNode;
  }

  if (typeof node !== "object" || node === null) {
    return null;
  }

  // Expression: { and: [...] } or { or: [...] }
  if ("and" in node || "or" in node) {
    const expr = node as { and?: unknown[]; or?: unknown[] };
    if (expr.and) {
      const transformedAnd = expr.and
        .map(transformLegacyNode)
        .filter((n): n is WhereNode => n !== null);
      return { and: transformedAnd };
    }
    if (expr.or) {
      const transformedOr = expr.or
        .map(transformLegacyNode)
        .filter((n): n is WhereNode => n !== null);
      return { or: transformedOr };
    }
  }

  return null;
}

function decodeLegacyFilter(value: string): WhereNode[] | null {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed
      .map(transformLegacyNode)
      .filter((n): n is WhereNode => n !== null);
  } catch {
    return null;
  }
}

// ============================================================================
// Code to URL Transform (for legacy serialize - kept for compatibility)
// ============================================================================

/**
 * Transform code node to URL node (legacy JSON format).
 * @deprecated Use encodeFilter instead
 */
export const transformCodeToUrl = (node: WhereNode): unknown => {
  if (isWhereRule(node)) {
    if (node.value == null) {
      return [node.property, node.condition];
    }
    return [node.property, node.condition, node.value];
  }

  if (isWhereExpression(node)) {
    if (node.and) {
      return { and: node.and.map(transformCodeToUrl) };
    }
    if (node.or) {
      return { or: node.or.map(transformCodeToUrl) };
    }
  }

  return node;
};

/**
 * Transform URL node to code node (legacy JSON format).
 * @deprecated Use decodeFilter instead
 */
export const transformUrlToCode = transformLegacyNode;

// ============================================================================
// Validator
// ============================================================================

/**
 * Validate and transform filter from URL.
 * Supports both new DSL format and legacy JSON format.
 */
export function filterValidator(value: unknown): WhereNode[] | null {
  if (typeof value !== "string") {
    return null;
  }
  if (!value) {
    return null;
  }

  // Check for legacy JSON format
  if (isLegacyFormat(value)) {
    return decodeLegacyFilter(value);
  }

  return decodeFilter(value);
}

// ============================================================================
// Column Validation
// ============================================================================

/**
 * Check if filter contains any invalid column names.
 */
function filterHasInvalidColumn(
  nodes: WhereNode[],
  validKeys: Set<string>
): boolean {
  for (const node of nodes) {
    if (isWhereRule(node)) {
      if (!validKeys.has(node.property)) {
        return true;
      }
    } else if (isWhereExpression(node)) {
      const items = node.and ?? node.or ?? [];
      if (filterHasInvalidColumn(items, validKeys)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Create a filter parser with optional column validation.
 * When validColumns is provided, filters with unknown column names are rejected.
 *
 * @example
 * ```ts
 * // Without validation (accepts any column name)
 * const parser = createFilterParser();
 *
 * // With validation (rejects unknown columns)
 * const productColumns = new Set(['name', 'price', 'category']);
 * const parser = createFilterParser(productColumns);
 * ```
 */
export function createFilterParser(validColumns?: string[] | Set<string>) {
  let validKeys: Set<string> | null = null;
  if (validColumns) {
    validKeys =
      validColumns instanceof Set ? validColumns : new Set(validColumns);
  }

  return createParser({
    parse: (value: string): WhereNode[] | null => {
      const filter = filterValidator(value);
      if (!filter) {
        return null;
      }

      // Validate column IDs if validation set is provided
      if (validKeys && filterHasInvalidColumn(filter, validKeys)) {
        return null;
      }

      return filter;
    },
    serialize: (value: WhereNode[]) => encodeFilter(value),
  });
}

// ============================================================================
// Parsers
// ============================================================================

/** Server-side parser for filter (no column validation) */
export const filterServerParser = createParser({
  parse: filterValidator,
  serialize: (value: WhereNode[]) => encodeFilter(value),
});

/** Client-side parser for filter (no column validation) */
export const parseAsFilter = createParser({
  parse: (value: string): WhereNode[] | null => filterValidator(value),
  serialize: (value: WhereNode[]) => encodeFilter(value),
});
