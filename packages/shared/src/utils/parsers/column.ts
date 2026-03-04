import { createParser } from "nuqs/server";
import {
  decodeGroup,
  encodeGroup,
  type GroupByConfigInput,
  type GroupConfigInput,
  groupConfigValidator,
} from "./group";

// ============================================================================
// Types
// ============================================================================

/**
 * ColumnBy URL format - same structure as GroupBy.
 * Board columns use the same configuration options as groups.
 *
 * URL param: ?column=select.category:sort:desc
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
export const columnConfigValidator = groupConfigValidator;

// ============================================================================
// Parsers
// ============================================================================

/** Server-side parser for column config */
export const columnServerParser = createParser({
  parse: columnConfigValidator,
  serialize: (value: ColumnConfigInput) => encodeColumn(value),
});

/** Client-side parser for column config */
export const parseAsColumnBy = createParser({
  parse: (value: string): ColumnConfigInput | null =>
    columnConfigValidator(value),
  serialize: (value: ColumnConfigInput) => encodeColumn(value),
});
