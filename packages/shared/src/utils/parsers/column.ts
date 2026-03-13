import { createParser } from "nuqs/server";
import type { GroupByConfig } from "../../types/group-config";
import { decodeGroup, encodeGroup } from "./group";

// Re-export types for consumers
export type { ColumnConfigInput } from "../../types/group-config";

// ============================================================================
// Types
// ============================================================================

/**
 * ColumnBy URL format - same structure as GroupBy.
 * Board columns use the same configuration options as groups.
 *
 * URL param: ?column=select.category,sort,desc
 */
export type ColumnByConfigInput = GroupByConfig;

// ============================================================================
// Encoder/Decoder (reuse group logic)
// ============================================================================

export const encodeColumn = encodeGroup;
export const decodeColumn = decodeGroup;

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
