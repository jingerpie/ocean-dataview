import { z } from "zod";

/**
 * Reserved group name for flat (non-grouped) pagination.
 * Represents pagination over "all" items (not grouped).
 * Using $ prefix to avoid collision with user group names.
 */
export const ALL_GROUP = "$all";

/**
 * Unified cursor state per group.
 * Works for both flat pagination (group = "$all") and grouped pagination.
 */
export const cursorStateSchema = z
	.object({
		group: z.string(), // ALL_GROUP for flat, or group key for grouped
		after: z.string().optional(), // forward cursor
		before: z.string().optional(), // backward cursor
		start: z
			.number()
			.optional()
			.transform((v) => v ?? 0), // display offset, defaults to 0
	})
	.refine((data) => !(data.after && data.before), {
		message: "Cannot have both after and before cursor",
	});

export type CursorState = z.infer<typeof cursorStateSchema>;

/**
 * Get cursor for a specific group
 */
export function getCursor(
	cursors: CursorState[],
	group: string,
): CursorState | undefined {
	return cursors.find((c) => c.group === group);
}

/**
 * Update cursor for a group (immutable).
 * Maintains array order - updates in place if exists, appends if new.
 */
export function setCursor(
	cursors: CursorState[],
	update: CursorState,
): CursorState[] {
	const index = cursors.findIndex((c) => c.group === update.group);
	if (index >= 0) {
		// Update in place to maintain order
		return [...cursors.slice(0, index), update, ...cursors.slice(index + 1)];
	}
	return [...cursors, update];
}

/**
 * Remove cursor for a group (back to first page)
 */
export function removeCursor(
	cursors: CursorState[],
	group: string,
): CursorState[] {
	return cursors.filter((c) => c.group !== group);
}

/**
 * Extract after/before for API call.
 * Handles both formats:
 * - CursorState object: extracts after/before from object
 * - string: treats as forward cursor (after)
 */
export function getCursorParams(cursor: CursorState | string | undefined): {
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
