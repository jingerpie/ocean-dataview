import { useMemo } from "react";
import type { DataViewProperty } from "../lib/data-views/types";

/**
 * Hook to compute display properties excluding groupBy and other special properties
 *
 * Handles:
 * - Filtering by propertyVisibility if specified
 * - Excluding special IDs (groupBy, preview, etc.)
 * - Maintaining specified order from propertyVisibility
 *
 * @param properties - All property definitions
 * @param propertyVisibility - Optional list of visible property IDs
 * @param excludeKeys - Property IDs to exclude (groupBy, preview, etc.)
 * @returns Filtered and ordered display properties
 */
export function useDisplayProperties<TData>(
	properties: readonly DataViewProperty<TData>[] | DataViewProperty<TData>[],
	propertyVisibility?: string[],
	excludeKeys?: string[],
): DataViewProperty<TData>[] {
	return useMemo(() => {
		let props: DataViewProperty<TData>[] = Array.from(properties);

		// Filter by propertyVisibility if specified
		if (propertyVisibility) {
			props = propertyVisibility
				.map((id) => properties.find((prop) => prop.id === id))
				.filter((prop): prop is DataViewProperty<TData> => prop !== undefined);
		}

		// Exclude special IDs if specified
		if (excludeKeys && excludeKeys.length > 0) {
			props = props.filter((prop) => !excludeKeys.includes(prop.id));
		}

		return props;
	}, [properties, propertyVisibility, excludeKeys]);
}
