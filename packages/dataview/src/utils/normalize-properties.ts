import type {
  DataViewProperty,
  DataViewPropertyInput,
} from "../types/property.type";

/**
 * Normalize properties by resolving `id` from `key` when not provided.
 *
 * For data-backed types: `id` defaults to `key` if omitted.
 * For formula/button types: `id` is already required.
 *
 * Also validates that resolved IDs are unique.
 *
 * @throws Error if duplicate IDs are found after resolution
 */
export function normalizeProperties<T>(
  properties: readonly DataViewPropertyInput<T>[]
): DataViewProperty<T>[] {
  const seen = new Set<string>();

  return properties.map((property) => {
    // Resolve id: formula/button always have id, others default to key
    const resolvedId =
      property.type === "formula" || property.type === "button"
        ? property.id
        : (property.id ?? property.key);

    if (seen.has(resolvedId)) {
      throw new Error(
        `Duplicate property id "${resolvedId}". Each property must have a unique id.`
      );
    }
    seen.add(resolvedId);

    // Return with resolved id
    return { ...property, id: resolvedId } as DataViewProperty<T>;
  });
}
