import type { FilterVariant } from "../types/data-table.type";

/**
 * Property type values that can be mapped to filter variants.
 * This mirrors the PropertyType from @ocean-dataview/dataview/types
 * but is defined here to avoid circular dependencies.
 */
type PropertyTypeValue =
  | "text"
  | "number"
  | "select"
  | "multiSelect"
  | "status"
  | "date"
  | "filesMedia"
  | "checkbox"
  | "url"
  | "email"
  | "phone"
  | "formula";

/**
 * Maps property type to the appropriate filter variant.
 * Used by filter UI components to determine which conditions and inputs to show.
 *
 * @param type - The property type (from DataViewProperty)
 * @returns The corresponding FilterVariant for filter UI
 */
export function getFilterVariantFromPropertyType(
  type: PropertyTypeValue | string
): FilterVariant {
  switch (type) {
    case "text":
    case "url":
    case "email":
    case "phone":
      return "text";
    case "number":
      return "number";
    case "select":
    case "status":
      return "select";
    case "multiSelect":
      return "multiSelect";
    case "date":
      return "date";
    case "checkbox":
      return "boolean";
    case "filesMedia":
      return "files";
    default:
      return "text";
  }
}
