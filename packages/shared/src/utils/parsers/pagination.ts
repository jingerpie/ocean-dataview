import { createParser } from "nuqs/server";
import {
  type Cursors,
  type CursorValue,
  LIMIT_OPTIONS,
  type Limit,
} from "../../types/pagination.type";
import {
  decodeStringArray,
  decodeTupleStrings,
  splitRespectingParens,
} from "../url-dsl/decoder";
import { encodeArray, encodeTuple } from "../url-dsl/encoder";

// ============================================================================
// DSL Format
// ============================================================================
// expanded: group-a,group-b,group-c
// cursor: after.abc123.10  OR  before.xyz789.20
// cursors: groupA.after.abc.10,groupB.before.xyz.20

// ============================================================================
// Expanded Encoder/Decoder
// ============================================================================

/**
 * Encode expanded groups to DSL format.
 * Example: ["group-a", "group-b"] → "group-a,group-b"
 */
export function encodeExpanded(expanded: string[]): string {
  if (expanded.length === 0) {
    return "";
  }
  return encodeArray(expanded);
}

/**
 * Decode DSL format to expanded groups.
 * Example: "group-a,group-b" → ["group-a", "group-b"]
 */
export function decodeExpanded(value: string): string[] | null {
  if (!value) {
    return null;
  }
  const result = decodeStringArray(value);
  return result.length > 0 ? result : null;
}

// ============================================================================
// Cursor Encoder/Decoder
// ============================================================================

/**
 * Encode cursor to DSL format.
 * Example: { after: "abc123", start: 10 } → "after.abc123.10"
 */
export function encodeCursor(cursor: CursorValue): string {
  if ("after" in cursor && cursor.after != null) {
    return encodeTuple(["after", cursor.after, cursor.start ?? 0]);
  }
  if ("before" in cursor && cursor.before != null) {
    return encodeTuple(["before", cursor.before, cursor.start ?? 0]);
  }
  return "";
}

/**
 * Decode DSL format to cursor.
 * Example: "after.abc123.10" → { after: "abc123", start: 10 }
 */
export function decodeCursor(value: string): CursorValue | null {
  if (!value) {
    return null;
  }

  const parts = decodeTupleStrings(value);
  if (parts.length < 2) {
    return null;
  }

  const direction = parts[0];
  const cursorValue = parts[1];
  const start = parts[2] ? Number(parts[2]) : 0;

  if (!cursorValue) {
    return null;
  }

  if (direction === "after") {
    return { after: cursorValue, start };
  }
  if (direction === "before") {
    return { before: cursorValue, start };
  }

  return null;
}

// ============================================================================
// Cursors Encoder/Decoder (per-group cursors)
// ============================================================================

/**
 * Encode cursors object to DSL format.
 * Flat mode (key = "__ungrouped__"): omits group key → "after.abc.10"
 * Grouped mode: includes group key → "groupA.after.abc.10"
 */
export function encodeCursors(cursors: Cursors): string {
  const entries = Object.entries(cursors);
  if (entries.length === 0) {
    return "";
  }

  return entries
    .map(([groupKey, cursor]) => {
      const direction = cursor.after != null ? "after" : "before";
      const value = cursor.after ?? cursor.before;
      const start = cursor.start ?? 0;

      if (value == null) {
        return "";
      }

      // Flat mode: omit group key for clean URLs
      if (groupKey === "__ungrouped__") {
        return encodeTuple([direction, value, start]);
      }
      // Grouped mode: include group key
      return encodeTuple([groupKey, direction, value, start]);
    })
    .filter(Boolean)
    .join(",");
}

/**
 * Build CursorValue from direction, cursor string, and start number.
 */
function buildCursorValue(
  direction: string,
  cursorValue: string,
  start: number
): CursorValue | null {
  if (direction === "after") {
    return { after: cursorValue, start };
  }
  if (direction === "before") {
    return { before: cursorValue, start };
  }
  return null;
}

const UNGROUPED_KEY = "__ungrouped__";

/**
 * Parse a single cursor item from DSL parts.
 * Returns [groupKey, cursor] tuple or null if invalid.
 */
function parseCursorItem(parts: string[]): [string, CursorValue] | null {
  if (parts.length === 3) {
    // Flat mode: direction.cursor.start
    const [direction, cursorValue, startStr] = parts;
    if (!(direction && cursorValue)) {
      return null;
    }
    const cursor = buildCursorValue(
      direction,
      cursorValue,
      Number(startStr) || 0
    );
    return cursor ? [UNGROUPED_KEY, cursor] : null;
  }

  if (parts.length >= 4) {
    // Grouped mode: group.direction.cursor.start
    const [groupKey, direction, cursorValue, startStr] = parts;
    if (!(groupKey && direction && cursorValue)) {
      return null;
    }
    const cursor = buildCursorValue(
      direction,
      cursorValue,
      Number(startStr) || 0
    );
    return cursor ? [groupKey, cursor] : null;
  }

  return null;
}

/**
 * Decode DSL format to cursors object.
 * Flat mode (3 parts): "after.abc.10" → { "__ungrouped__": {...} }
 * Grouped mode (4 parts): "groupA.after.abc.10" → { groupA: {...} }
 */
export function decodeCursors(value: string): Cursors | null {
  if (!value) {
    return null;
  }

  const items = splitRespectingParens(value, ",");
  const result: Cursors = {};

  for (const item of items) {
    const parts = decodeTupleStrings(item);
    const parsed = parseCursorItem(parts);
    if (parsed) {
      const [key, cursor] = parsed;
      result[key] = cursor;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

// ============================================================================
// Legacy JSON Support (for migration)
// ============================================================================

function isLegacyFormat(value: string): boolean {
  return value.startsWith("[") || value.startsWith("{");
}

function decodeLegacyExpanded(value: string): string[] | null {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed.every((v) => typeof v === "string")
      ? (parsed as string[])
      : null;
  } catch {
    return null;
  }
}

function decodeLegacyCursor(value: string): CursorValue | null {
  try {
    const parsed = JSON.parse(value);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }
    return parsed as CursorValue;
  } catch {
    return null;
  }
}

function decodeLegacyCursors(value: string): Cursors | null {
  try {
    const parsed = JSON.parse(value);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }
    return parsed as Cursors;
  } catch {
    return null;
  }
}

// ============================================================================
// Validators
// ============================================================================

/** Expanded validator */
export function expandedValidator(value: unknown): string[] | null {
  if (typeof value === "string") {
    if (isLegacyFormat(value)) {
      return decodeLegacyExpanded(value);
    }
    return decodeExpanded(value);
  }

  if (!Array.isArray(value)) {
    return null;
  }
  return value.every((v) => typeof v === "string") ? (value as string[]) : null;
}

/** Cursor validator */
export function cursorValidator(value: unknown): CursorValue | null {
  if (typeof value === "string") {
    if (isLegacyFormat(value)) {
      return decodeLegacyCursor(value);
    }
    return decodeCursor(value);
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as CursorValue;
}

/** Cursors validator */
export function cursorsValidator(value: unknown): Cursors | null {
  if (typeof value === "string") {
    if (isLegacyFormat(value)) {
      return decodeLegacyCursors(value);
    }
    return decodeCursors(value);
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Cursors;
}

// ============================================================================
// Server Parsers
// ============================================================================

/** Server-side parser for limit */
export const limitServerParser = createParser({
  parse: (value: string): Limit | null => {
    const num = Number.parseInt(value, 10);
    if (LIMIT_OPTIONS.includes(num as Limit)) {
      return num as Limit;
    }
    return null;
  },
  serialize: (value: Limit) => String(value),
}).withDefault(25);

/** Server-side parser for cursor */
export const cursorServerParser = createParser({
  parse: cursorValidator,
  serialize: (value: CursorValue) => encodeCursor(value),
});

/** Server-side parser for cursors */
export const cursorsServerParser = createParser({
  parse: cursorsValidator,
  serialize: (value: Cursors) => encodeCursors(value),
}).withDefault({});

/** Server-side parser for expanded */
export const expandedServerParser = createParser({
  parse: expandedValidator,
  serialize: (value: string[]) => encodeExpanded(value),
}).withDefault([]);

// ============================================================================
// Client Parsers
// ============================================================================

/** Client-side parser for cursor */
export const parseAsCursor = createParser({
  parse: (value: string): CursorValue | null => cursorValidator(value),
  serialize: (value: CursorValue) => encodeCursor(value),
});

/** Client-side parser for cursors */
export const parseAsCursors = createParser({
  parse: (value: string): Cursors | null => cursorsValidator(value),
  serialize: (value: Cursors) => encodeCursors(value),
});

/** Client-side parser for expanded groups */
export const parseAsExpanded = createParser({
  parse: (value: string): string[] | null => expandedValidator(value),
  serialize: (value: string[]) => encodeExpanded(value),
});
