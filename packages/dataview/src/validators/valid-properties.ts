import type { DataViewProperty } from "../types/property.type";

/**
 * Validates that all property IDs are unique
 * @param properties - Array of DataViewProperty schema
 * @returns Error message if duplicate IDs found, undefined otherwise
 */
export function validatePropertyKeys<T>(
  properties: readonly DataViewProperty<T>[] | DataViewProperty<T>[]
): string | undefined {
  const ids = properties.map((p) => p.id);
  const uniqueIds = new Set(ids);

  if (ids.length !== uniqueIds.size) {
    // Find duplicate IDs
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    const uniqueDuplicates = [...new Set(duplicates)];

    return `Duplicate property IDs found: ${uniqueDuplicates.join(", ")}. Each property must have a unique ID.`;
  }

  return undefined;
}
