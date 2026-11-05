/**
 * Row identity for TanStack's selection state.
 *
 * Rows with an `id` are keyed by it, so a selection keeps pointing at the same
 * records across refetches, sorting and paging, and rows that disappear
 * (deleted, filtered out) drop out of it. TanStack's default, the row index,
 * would re-select whatever moved into the same positions after a bulk delete
 * — with destructive bulk actions that is the wrong rows. It also shares one
 * selection state across grouped tables, where index keys would select "row 0"
 * in every group at once. Rows without an `id` fall back to the index.
 */
export function rowId(row: unknown, index: number): string {
  const id = (row as { id?: unknown } | null | undefined)?.id;
  return typeof id === "string" || typeof id === "number"
    ? String(id)
    : String(index);
}
