import { createParser } from "nuqs/server";
import {
  decodeArrayValue,
  matchExpression,
  parsePrimitive,
  splitRespectingParens,
} from "../lib/url-dsl/decoder";
import {
  encodeArrayValue,
  encodePrimitive,
  encodeTuple,
} from "../lib/url-dsl/encoder";
import {
  isWhereExpression,
  isWhereRule,
  type WhereNode,
  type WhereRule,
} from "../types/filter.type";

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
// Validator
// ============================================================================

/**
 * Validate and transform filter from URL.
 */
export function filterValidator(value: unknown): WhereNode[] | null {
  if (typeof value !== "string" || !value) {
    return null;
  }
  return decodeFilter(value);
}

// ============================================================================
// Parsers
// ============================================================================

/** Server-side parser for filter (no column validation) */
export const filterServerParser = createParser<WhereNode[] | null>({
  parse: filterValidator,
  serialize: (value: WhereNode[] | null) => (value ? encodeFilter(value) : ""),
});

/** Client-side parser for filter (no column validation) */
export const parseAsFilter = createParser<WhereNode[] | null>({
  parse: (value: string): WhereNode[] | null => filterValidator(value),
  serialize: (value: WhereNode[] | null) => (value ? encodeFilter(value) : ""),
});
