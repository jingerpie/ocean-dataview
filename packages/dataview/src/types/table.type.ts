import type { PropertyType } from "./property.type";

/**
 * Extend TanStack Table's ColumnMeta to include our custom properties
 */
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    /**
     * Property type for this column, used for column width calculations
     */
    propertyType?: PropertyType;
  }
}
