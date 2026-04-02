import type { DataViewProperty } from "../types/property.type";

/**
 * Type for transformed data - only contains property-defined fields
 */
export type TransformedData = Record<string, unknown>;

/**
 * Transforms raw data to only include property-defined fields.
 * This reduces memory footprint and improves React render performance.
 *
 * For each property:
 * - Formula/button properties: Set to null (rendered with full context)
 * - Other properties: Auto-maps item[property.key] to transformed[property.key]
 *
 * All other fields from raw data are dropped.
 *
 * @param rawData - Array of raw data items from API/database
 * @param properties - Property schema that define the transformation (should be normalized)
 * @returns Array of transformed data objects containing only property fields
 *
 * @example
 * const rawData = [{ id: 123, name: "Item", price: 100, internal: "hidden" }];
 * const properties = [
 *   { key: "id", type: "text" },    // Auto-maps to item.id
 *   { key: "name", type: "text" },  // Auto-maps to item.name
 * ];
 * const transformed = transformData(rawData, properties);
 * // Result: [{ id: 123, name: "Item" }]
 * // Note: price and internal fields are dropped
 */
export function transformData<TData>(
  rawData: readonly TData[],
  properties: readonly DataViewProperty<TData>[]
): TransformedData[] {
  return rawData.map((item) => {
    const transformed: TransformedData = {};

    for (const property of properties) {
      if (property.type === "formula" || property.type === "button") {
        // Formula/button properties are rendered with full context
        transformed[property.id] = null;
      } else {
        // Read from item[key], write to transformed[key]
        transformed[property.key] = (item as Record<string, unknown>)[
          property.key
        ];
      }
    }

    return transformed;
  });
}
