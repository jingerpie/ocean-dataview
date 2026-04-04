import type { GroupConfigInput } from "../types/group.type";
import type { DataViewProperty, PropertyMeta } from "../types/property.type";

// ============================================================================
// ShowAs Validation
// ============================================================================

/**
 * Validates showAs configuration against property type
 * @param propertyType - The type of the property being grouped by
 * @param propertyKey - The key of the property for error messages
 * @param showAs - The showAs configuration value
 * @returns Error message string if invalid, null if valid
 */
export function validateShowAs(
  propertyType: string,
  propertyKey: string,
  showAs: string | undefined
): string | null {
  if (!showAs) {
    return null;
  }

  // Check date property with date-specific showAs
  if (propertyType === "date") {
    const validDateShowAs = ["day", "week", "month", "year", "relative"];
    if (!validDateShowAs.includes(showAs)) {
      return `Property "${propertyKey}" is type 'date' and cannot use showAs: '${showAs}'. Valid options for date properties: ${validDateShowAs.join(
        ", "
      )}`;
    }
  }

  // Check status property with status-specific showAs
  if (propertyType === "status") {
    const validStatusShowAs = ["option", "group"];
    if (!validStatusShowAs.includes(showAs)) {
      return `Property "${propertyKey}" is type 'status' and cannot use showAs: '${showAs}'. Valid options for status properties: ${validStatusShowAs.join(
        ", "
      )}`;
    }
  }

  // Check other properties don't use date/status showAs
  if (propertyType !== "date" && propertyType !== "status") {
    const dateOrStatusShowAs = [
      "day",
      "week",
      "month",
      "year",
      "relative",
      "option",
      "group",
    ];
    if (dateOrStatusShowAs.includes(showAs)) {
      return `Property "${propertyKey}" is type '${propertyType}' and cannot use showAs: '${showAs}'. This showAs option is only for date or status properties.`;
    }
  }

  return null;
}

/** Minimal property shape for validation (works with both DataViewProperty and PropertyMeta) */
type PropertyLike = Pick<PropertyMeta, "enableGroup" | "id" | "type">;

/**
 * Validates group configuration for views
 * @param properties - Array of property schema
 * @param groupBy - The property ID to group by (references property.id, not data key)
 * @param showAs - Optional showAs configuration
 * @returns Error message string if invalid, null if valid
 */
export function validateGroupConfig(
  properties: readonly PropertyLike[],
  groupBy: string,
  showAs?:
    | "day"
    | "week"
    | "month"
    | "year"
    | "relative"
    | "group"
    | "option"
    | "exact"
    | "alphabetical"
): string | null {
  // groupBy references property IDs
  // Find a property that matches this ID for validation
  const groupByProperty = properties.find((prop) => prop.id === groupBy);

  // If no property found, allow it - user may define property later
  // The component will handle missing property gracefully
  if (!groupByProperty) {
    return null;
  }

  // If property found, validate showAs compatibility with property type
  return validateShowAs(groupByProperty.type, String(groupBy), showAs);
}

// ============================================================================
// Property Extraction
// ============================================================================

/** Property types that cannot be grouped */
const NON_GROUPABLE_TYPES = new Set(["formula", "button", "filesMedia"]);

/**
 * Extract groupable property IDs from properties.
 * Excludes formula, button, filesMedia types which aren't groupable.
 * Respects enableGroup: false on individual properties.
 */
function getGroupablePropertyIds(
  properties: readonly PropertyLike[]
): Set<string> {
  return new Set(
    properties
      .filter(
        (p) => !NON_GROUPABLE_TYPES.has(p.type) && p.enableGroup !== false
      )
      .map((p) => p.id)
  );
}

// ============================================================================
// Pure Validation Function
// ============================================================================

/**
 * Validate group config against property schema.
 * Returns null if property doesn't exist (so url ?? defaults still works).
 *
 * Accepts both DataViewProperty[] and PropertyMeta[] for flexibility.
 *
 * @example
 * ```ts
 * const group = parseAsGroupBy(url);
 * const validatedGroup = validateGroup(group, productProperties);
 * ```
 */
export function validateGroup<T>(
  group: GroupConfigInput | null,
  properties: readonly DataViewProperty<T>[] | readonly PropertyMeta[]
): GroupConfigInput | null {
  if (!group) {
    return null;
  }
  const validPropertyIds = getGroupablePropertyIds(properties);
  return validPropertyIds.has(group.propertyId) ? group : null;
}
