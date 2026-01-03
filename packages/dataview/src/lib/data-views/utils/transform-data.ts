import type { DataViewProperty } from "../types/property-types";

/**
 * Type for transformed data - only contains property-defined fields
 */
export type TransformedData = Record<string, unknown>;

/**
 * Transforms raw data to only include property-defined fields
 * This reduces memory footprint and improves React render performance
 *
 * For each property:
 * - If property has a value function: Calls it with full item, stores result
 * - If property has no value function: Auto-maps item[property.id] to transformed[property.id]
 *
 * All other fields from raw data are dropped.
 *
 * @param rawData - Array of raw data items from API/database
 * @param properties - Property definitions that define the transformation
 * @returns Array of transformed data objects containing only property fields
 *
 * @example
 * const rawData = [{ id: 123, name: "Item", price: 100, internal: "hidden" }];
 * const properties = [
 *   { id: "id", type: "text" },  // Auto-maps to item.id
 *   { id: "displayName", type: "text", value: (item) => item.name.toUpperCase() },
 * ];
 * const transformed = transformData(rawData, properties);
 * // Result: [{ id: 123, displayName: "ITEM" }]
 * // Note: name, price, and internal fields are dropped
 */
export function transformData<TData>(
	rawData: readonly TData[],
	properties: readonly DataViewProperty<TData>[],
): TransformedData[] {
	return rawData.map((item) => {
		const transformed: TransformedData = {};

		for (const property of properties) {
			if (property.value) {
				// Transform: Call value function with full item, store result
				transformed[property.id] = property.value(item);
			} else {
				// Pass: Auto-map property.id to field name
				transformed[property.id] = (item as Record<string, unknown>)[
					property.id
				];
			}
		}

		// Clean: Only property.id fields remain, all others dropped
		return transformed;
	});
}
