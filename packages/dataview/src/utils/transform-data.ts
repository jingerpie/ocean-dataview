import type { DataViewProperty } from "../types/property.type";

/**
 * Type for transformed data - preserves all raw fields
 * with resolved property keys layered on top.
 */
export type TransformedData = Record<string, unknown>;

/**
 * Resolves a dot-notation key against a raw data object.
 * Checks in order:
 * 1. Flat key (scalar rollup extra, e.g. "listingVariants.quantity")
 * 2. Deduplicated extras key (e.g. "listingVariants.price.maxPrice" for id "maxPrice")
 * 3. Nested traversal (flattened relation object-of-arrays)
 */
function resolveDotKey(
  raw: Record<string, unknown>,
  key: string,
  id: string
): unknown | undefined {
  // Scalar rollup extras — flat top-level key
  if (key in raw) {
    return raw[key];
  }
  // Deduplicated scalar rollup extras — key_id
  const extrasKey = `${key}_${id}`;
  if (extrasKey in raw) {
    return raw[extrasKey];
  }
  // Display rollups — nested traversal into flattened object-of-arrays
  const dotIndex = key.indexOf(".");
  const parent = raw[key.slice(0, dotIndex)];
  if (parent && typeof parent === "object") {
    return (parent as Record<string, unknown>)[key.slice(dotIndex + 1)];
  }
  return undefined;
}

/**
 * Preserves all raw fields and layers resolved property keys on top.
 * This ensures formulas and bulk actions can access any raw field,
 * while property-keyed values (rollups, dot-notation) are normalized
 * for uniform downstream access via property.id.
 *
 * Expects rollup display values (showOriginal/showUnique) to already
 * be flattened into dot-keyed arrays by the server (flattenRelationArrays).
 * Scalar rollup values are pre-computed as SQL extras.
 *
 * @param rawData - Array of raw data items from API/database
 * @param properties - Property schema (should be normalized, i.e. id is set)
 * @returns Array of data objects with raw fields + resolved property keys
 */
export function transformData<TData>(
  rawData: readonly TData[],
  properties: readonly DataViewProperty<TData>[]
): TransformedData[] {
  return rawData.map((item) => {
    const raw = item as Record<string, unknown>;
    const transformed: TransformedData = { ...raw };

    for (const property of properties) {
      if (property.type === "formula" || property.type === "button") {
        continue;
      }

      if (!property.key) {
        continue;
      }

      const key = property.key;
      const id = property.id ?? key;
      if (key.includes(".")) {
        transformed[id] = resolveDotKey(raw, key, id);
      } else if (id !== key) {
        transformed[id] = raw[key];
      }
    }

    return transformed;
  });
}
