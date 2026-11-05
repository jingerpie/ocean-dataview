import type { GroupByConfig } from "../types/group.type";
import { decodeGroup, encodeGroup } from "./group";

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
