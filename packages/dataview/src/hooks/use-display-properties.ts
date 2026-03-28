import { useMemo } from "react";
import type { DataViewProperty } from "../types/property.type";

/**
 * Hook to compute display properties excluding groupBy and other special properties
 *
 * Handles:
 * - Filtering out properties with hidden: true
 * - Filtering by propertyVisibility if specified
 * - Excluding special IDs (groupBy, preview, etc.)
 * - Maintaining specified order from propertyVisibility
 *
 * @param properties - All property schema
 * @param propertyVisibility - Optional list of visible property IDs
 * @param excludeKeys - Property IDs to exclude (groupBy, preview, etc.)
 * @returns Filtered and ordered display properties
 */
export function useDisplayProperties<TData>(
  properties: readonly DataViewProperty<TData>[] | DataViewProperty<TData>[],
  propertyVisibility?: string[],
  excludeKeys?: string[]
): DataViewProperty<TData>[] {
  return useMemo(() => {
    // Start with properties that are not hidden
    let props: DataViewProperty<TData>[] = Array.from(properties).filter(
      (prop) => prop.hidden !== true
    );

    // Filter by propertyVisibility if specified
    if (propertyVisibility) {
      props = propertyVisibility
        .map((id) => props.find((prop) => prop.id === id))
        .filter((prop): prop is DataViewProperty<TData> => prop !== undefined);
    }

    // Exclude special IDs if specified
    if (excludeKeys && excludeKeys.length > 0) {
      props = props.filter((prop) => !excludeKeys.includes(prop.id));
    }

    return props;
  }, [properties, propertyVisibility, excludeKeys]);
}
