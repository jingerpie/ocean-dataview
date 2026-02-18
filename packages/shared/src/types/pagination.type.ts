import { z } from "zod";

/**
 * Standard limit values for pagination.
 * Used across all pagination hooks and components.
 */
export const LIMIT_OPTIONS = [10, 25, 50, 100, 200] as const;

/**
 * Valid limit values for pagination.
 */
export type Limit = (typeof LIMIT_OPTIONS)[number];

/**
 * Default limit value.
 */
export const DEFAULT_LIMIT: Limit = 25;

/**
 * Cursor value for pagination state.
 * - Flat pagination: used directly as `cursor` param
 * - Grouped pagination: used as values in `cursors` object map
 */
export const cursorValueSchema = z.object({
  after: z.string().optional(), // forward cursor
  before: z.string().optional(), // backward cursor
  start: z
    .number()
    .optional()
    .transform((v) => v ?? 0), // display offset, defaults to 0
});

export type CursorValue = z.infer<typeof cursorValueSchema>;

/**
 * Cursors as object/map for grouped pagination: { [groupKey]: CursorValue }
 * Example: { "Electronics": { after: "..." }, "Clothing": { after: "..." } }
 *
 * Note: Flat pagination uses `cursor` (single CursorValue) instead.
 */
export const cursorsSchema = z.record(z.string(), cursorValueSchema);

export type Cursors = z.infer<typeof cursorsSchema>;

/**
 * Extract after/before for API call.
 * Handles both formats:
 * - CursorValue object: extracts after/before from object
 * - string: treats as forward cursor (after) - for infinite queries
 */
export function getCursorParams(cursor: CursorValue | string | undefined): {
  after: string | undefined;
  before: string | undefined;
} {
  if (typeof cursor === "string") {
    return { after: cursor, before: undefined };
  }
  return {
    after: cursor?.after,
    before: cursor?.before,
  };
}
