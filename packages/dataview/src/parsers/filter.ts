import { createParser } from "nuqs/server";
import {
  decodeArrayValue,
  matchExpression,
  parsePrimitive,
  splitByDot,
  splitRespectingParens,
  unescapeValue,
} from "../lib/url-dsl/decoder";
import {
  encodeArrayValue,
  encodePrimitive,
  encodeTuple,
} from "../lib/url-dsl/encoder";
import {
  isWhereExpression,
  isWhereRule,
  type Quantifier,
  type WhereNode,
  type WhereRule,
} from "../types/filter.type";

// ============================================================================
// DSL Format
// ============================================================================
// Rule: property.condition[.value]
// Array value: property.condition.(value1,value2,value3)
// Array quantifier: any(rule) | none(rule) | every(rule)
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

  let encoded: string;

  if (rule.value === undefined || rule.value === null) {
    encoded = baseParts.join(".");
  } else {
    const value = rule.value;

    // Handle array values with parentheses wrapper
    if (Array.isArray(value)) {
      const primitiveArray = value.filter(
        (v): v is string | number | boolean =>
          typeof v === "string" ||
          typeof v === "number" ||
          typeof v === "boolean"
      );
      const arrayStr = encodeArrayValue(primitiveArray);
      encoded = `${baseParts.join(".")}.${arrayStr}`;
    } else if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      encoded = encodeTuple([rule.property, rule.condition, value]);
    } else {
      // Fallback: serialize to JSON string for complex objects
      encoded = encodeTuple([
        rule.property,
        rule.condition,
        JSON.stringify(value),
      ]);
    }
  }

  // Wrap with array quantifier if present
  if (rule.quantifier) {
    return `${rule.quantifier}(${encoded})`;
  }

  return encoded;
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
  // Split by dots, respecting quoted values (e.g. "listingVariants.sku".iLike."value")
  const parts = splitByDot(value);

  if (parts.length < 2) {
    return null;
  }

  const property = unescapeValue(parts[0] ?? "").value;
  const condition = unescapeValue(parts[1] ?? "").value;

  if (!(property && condition)) {
    return null;
  }

  // Only property.condition, no value
  if (parts.length === 2) {
    return { property, condition } as WhereRule;
  }

  // Rejoin remaining parts as the value string (handles unquoted dots in values)
  const valueStr = parts.slice(2).join(".");

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
const QUANTIFIER_REGEX = /^(any|none|every)\((.+)\)$/;

function decodeNode(value: string): WhereNode | null {
  // Check for array quantifier wrapper: any(...), none(...), every(...)
  const quantifierMatch = value.match(QUANTIFIER_REGEX);
  if (quantifierMatch?.[1] && quantifierMatch[2]) {
    const rule = decodeRule(quantifierMatch[2]);
    if (rule) {
      rule.quantifier = quantifierMatch[1] as Quantifier;
    }
    return rule;
  }

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
