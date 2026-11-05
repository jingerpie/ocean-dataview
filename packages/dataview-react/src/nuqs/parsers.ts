import type {
  Cursors,
  CursorValue,
  SortQuery,
  WhereNode,
} from "@sparkyidea/dataview-core";
import {
  cursorsValidator,
  cursorValidator,
  decodeColumn,
  decodeGroup,
  encodeColumn,
  encodeCursor,
  encodeCursors,
  encodeExpanded,
  encodeFilter,
  encodeGroup,
  encodeSort,
  expandedValidator,
  filterValidator,
  LIMIT_OPTIONS,
  type Limit,
  sortValidator,
} from "@sparkyidea/dataview-core";
import { createParser } from "nuqs/server";

// ============================================================================
// Parsers
// ============================================================================

/** Server-side parser for column config (no validation) */
export const columnServerParser = createParser({
  parse: decodeColumn,
  serialize: encodeColumn,
});

/** Client-side parser for column config (no validation) */
export const parseAsColumnBy = createParser({
  parse: decodeColumn,
  serialize: encodeColumn,
});

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

// ============================================================================
// Parsers
// ============================================================================

/** Server-side parser for group config (no validation) */
export const groupServerParser = createParser({
  parse: decodeGroup,
  serialize: encodeGroup,
});

/** Client-side parser for group config (alias of groupServerParser) */
export const parseAsGroupBy = groupServerParser;

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

// ============================================================================
// Parsers
// ============================================================================

/** Server-side parser for sort (no column validation, no default) */
export const sortServerParser = createParser<SortQuery[] | null>({
  parse: sortValidator,
  serialize: (value: SortQuery[] | null) => (value ? encodeSort(value) : ""),
});

/** Client-side parser for sort (no column validation) */
export const parseAsSort = createParser<SortQuery[] | null>({
  parse: (value: string): SortQuery[] | null => sortValidator(value),
  serialize: (value: SortQuery[] | null) => (value ? encodeSort(value) : ""),
});
