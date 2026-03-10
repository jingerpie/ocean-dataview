import { createParser } from "nuqs/server";
import {
  decodeGroup,
  encodeGroup,
  type GroupByConfigInput,
  type GroupConfigInput,
} from "./group";

// ============================================================================
// Types
// ============================================================================

/**
 * ColumnBy URL format - same structure as GroupBy.
 * Board columns use the same configuration options as groups.
 *
 * URL param: ?column=select.category,sort,desc
 */
export type ColumnByConfigInput = GroupByConfigInput;

/**
 * Column configuration - same structure as GroupConfig.
 * Board columns support the same options as groups.
 */
export type ColumnConfigInput = GroupConfigInput;

// ============================================================================
// Encoder/Decoder (reuse group logic)
// ============================================================================

export const encodeColumn = encodeGroup;
export const decodeColumn = decodeGroup;

// ============================================================================
// Parsers
// ============================================================================

/** Server-side parser for column config */
export const columnServerParser = createParser({
  parse: decodeColumn,
  serialize: encodeColumn,
});

/** Client-side parser for column config */
export const parseAsColumnBy = createParser({
  parse: decodeColumn,
  serialize: encodeColumn,
});
