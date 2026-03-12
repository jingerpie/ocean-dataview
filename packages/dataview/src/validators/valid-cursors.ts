import type { GroupConfigInput } from "../types/group.type";
import type { Cursors } from "../types/pagination";

const UNGROUPED_KEY = "__ungrouped__";

/**
 * Validate cursors against the current group configuration.
 *
 * - If no grouping (group is null): only allow __ungrouped__ cursor
 * - If grouped: filter out __ungrouped__ cursor (invalid in grouped mode)
 *
 * This sanitizes stale deep links where cursor keys don't match current state.
 *
 * @example
 * ```ts
 * // Flat mode - keep only __ungrouped__
 * validateCursors({ __ungrouped__: {...}, Books: {...} }, null)
 * // → { __ungrouped__: {...} }
 *
 * // Grouped mode - remove __ungrouped__
 * validateCursors({ __ungrouped__: {...}, Books: {...} }, { propertyId: "category" })
 * // → { Books: {...} }
 * ```
 */
export function validateCursors(
  cursors: Cursors | null,
  group: GroupConfigInput | null
): Cursors {
  if (!cursors || Object.keys(cursors).length === 0) {
    return {};
  }

  if (!group) {
    // Flat mode: only allow __ungrouped__ key
    const ungroupedCursor = cursors[UNGROUPED_KEY];
    if (ungroupedCursor) {
      return { [UNGROUPED_KEY]: ungroupedCursor };
    }
    return {};
  }

  // Grouped mode: filter out __ungrouped__ (shouldn't exist in grouped mode)
  const result: Cursors = {};
  for (const [key, value] of Object.entries(cursors)) {
    if (key !== UNGROUPED_KEY) {
      result[key] = value;
    }
  }
  return result;
}
