/**
 * Canonical group configuration types.
 *
 * These types use `propertyType` as the discriminant field instead of
 * object keys like `byDate`, `byStatus`, etc. This allows:
 * - Direct mapping to/from URL DSL format
 * - Cleaner switch statements
 * - Better V8 hidden class optimization (consistent object shape)
 */

// =============================================================================
// Show As Options
// =============================================================================

/** Date grouping display options */
export type DateShowAs = "day" | "week" | "month" | "year" | "relative";

/** Status grouping display options */
export type StatusShowAs = "option" | "group";

/** Text grouping display options */
export type TextShowAs = "exact" | "alphabetical";

/** Week start day */
export type WeekStartDay = "monday" | "sunday";

/** Number range configuration */
export interface NumberRange {
  range: [number, number];
  step: number;
}

// =============================================================================
// Group By Config (Discriminated Union on propertyType)
// =============================================================================

/** Date grouping configuration */
export interface DateGroupByConfig {
  propertyId: string;
  propertyType: "date";
  showAs: DateShowAs;
  startWeekOn?: WeekStartDay;
}

/** Status grouping configuration */
export interface StatusGroupByConfig {
  propertyId: string;
  propertyType: "status";
  showAs?: StatusShowAs;
}

/** Select grouping configuration */
export interface SelectGroupByConfig {
  propertyId: string;
  propertyType: "select";
}

/** MultiSelect grouping configuration */
export interface MultiSelectGroupByConfig {
  propertyId: string;
  propertyType: "multiSelect";
}

/** Checkbox grouping configuration */
export interface CheckboxGroupByConfig {
  propertyId: string;
  propertyType: "checkbox";
}

/** Text grouping configuration */
export interface TextGroupByConfig {
  propertyId: string;
  propertyType: "text";
  showAs?: TextShowAs;
}

/** Number grouping configuration */
export interface NumberGroupByConfig {
  numberRange?: NumberRange;
  propertyId: string;
  propertyType: "number";
}

/** Property types that support grouping */
export type GroupablePropertyType =
  | "date"
  | "status"
  | "select"
  | "multiSelect"
  | "checkbox"
  | "text"
  | "number";

/** Discriminated union of all group-by configurations */
export type GroupByConfig =
  | DateGroupByConfig
  | StatusGroupByConfig
  | SelectGroupByConfig
  | MultiSelectGroupByConfig
  | CheckboxGroupByConfig
  | TextGroupByConfig
  | NumberGroupByConfig;

// =============================================================================
// Group Config Input (With Sort/HideEmpty Options)
// =============================================================================

/** Shared options for all group configs */
export interface GroupOptions {
  hideEmpty?: boolean;
  showCount?: boolean;
  sort?: "asc" | "desc";
}

/** Full group configuration including options */
export type GroupConfigInput = GroupByConfig & GroupOptions;

/** Column configuration (same as group for board columns) */
export type ColumnConfigInput = GroupByConfig & GroupOptions;

// =============================================================================
// Parsed Group Config (Internal/SQL Builder Format)
// =============================================================================

/**
 * Normalized/flattened group config for SQL builders.
 *
 * This is an internal format used by buildGroupBy/buildGroupWhere.
 * The canonical GroupConfigInput is converted to this before SQL generation.
 */
export interface ParsedGroupConfig {
  numberRange?: NumberRange;
  property: string;
  propertyType: GroupablePropertyType;
  showAs?: DateShowAs | StatusShowAs;
  startWeekOn?: WeekStartDay;
  textShowAs?: TextShowAs;
}

// =============================================================================
// Adapter Functions
// =============================================================================

/**
 * Convert canonical GroupByConfig to ParsedGroupConfig for SQL builders.
 *
 * This adapter is required because SQL builders use a flat structure
 * with separate fields for different showAs types (showAs, textShowAs).
 */
export function toParsedGroupConfig(config: GroupByConfig): ParsedGroupConfig {
  const base = {
    property: config.propertyId,
    propertyType: config.propertyType,
  };

  switch (config.propertyType) {
    case "date":
      return {
        ...base,
        showAs: config.showAs,
        startWeekOn: config.startWeekOn,
      };

    case "status":
      return {
        ...base,
        showAs: config.showAs ?? "option",
      };

    case "text":
      return {
        ...base,
        textShowAs: config.showAs ?? "exact",
      };

    case "number":
      return {
        ...base,
        numberRange: config.numberRange,
      };

    case "select":
    case "multiSelect":
    case "checkbox":
      return base;

    default: {
      // Exhaustive check
      const _exhaustive: never = config;
      throw new Error(
        `Unknown property type: ${(_exhaustive as GroupByConfig).propertyType}`
      );
    }
  }
}
