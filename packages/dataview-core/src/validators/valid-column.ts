import type { ColumnConfigInput } from "../types/group.type";
import type { DataViewProperty, PropertyMeta } from "../types/property.type";
import { validateGroup } from "./valid-group";

/**
 * Validate column config against property schema.
 * Uses the same validation logic as validateGroup.
 *
 * Accepts both DataViewProperty[] and PropertyMeta[] for flexibility.
 *
 * @example
 * ```ts
 * const column = parseAsColumnBy(url);
 * const validatedColumn = validateColumn(column, productProperties);
 * ```
 */
export function validateColumn<T>(
  column: ColumnConfigInput | null,
  properties: readonly DataViewProperty<T>[] | readonly PropertyMeta[]
): ColumnConfigInput | null {
  return validateGroup(column, properties);
}
