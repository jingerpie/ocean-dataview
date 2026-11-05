import type { DataViewProperty } from "../types/property.type";

/**
 * Normalize properties by resolving `id` through the priority chain.
 *
 * Resolution priority (matches TanStack Table pattern):
 * 1. Explicit `id`
 * 2. `key` (data field accessor)
 * 3. `name` (display name)
 * 4. Array index fallback
 *
 * Also validates that resolved IDs are unique.
 *
 * @throws Error if duplicate IDs are found after resolution
 */
export function normalizeProperties<T>(
  properties: readonly DataViewProperty<T>[]
): DataViewProperty<T>[] {
  const seen = new Set<string>();

  return properties.map((property, index) => {
    const resolvedId =
      property.id ?? property.key ?? property.name ?? String(index);

    if (seen.has(resolvedId)) {
      throw new Error(
        `Duplicate property id "${resolvedId}". Each property must have a unique id.`
      );
    }
    seen.add(resolvedId);

    return { ...property, id: resolvedId };
  });
}
