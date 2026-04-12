import type { ComponentType, SVGProps } from "react";
import type { WhereNode } from "./filter.type";

/**
 * Generic icon type that accepts any SVG icon component.
 * Works with Lucide, Heroicons, or any custom SVG component.
 */
export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type PropertyType =
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
  | "formula"
  | "button"
  | "rollup";

// Base property structure (using _T for type consistency across property types)
export interface BaseProperty<_T> {
  /**
   * Enable filtering for this property.
   * When false, property won't appear in the filter dropdown.
   * @default true
   */
  enableFilter?: boolean;

  /**
   * Enable grouping for this property.
   * When false, property won't appear in the group picker.
   * @default true
   */
  enableGroup?: boolean;

  /**
   * Enable search for this property.
   * - `true`: Include in search (even if type would be excluded by default)
   * - `false`: Exclude from search (even if type would be included by default)
   * - `undefined`: Use type-based default (excluded: filesMedia, checkbox, formula)
   * @default true (except filesMedia, checkbox, formula which default to false)
   */
  enableSearch?: boolean;

  /**
   * Enable sorting for this property.
   * When false, property won't appear in the sort dropdown.
   * @default true
   */
  enableSort?: boolean;

  // ===== Constraint fields =====

  /**
   * Hide from columns & visibility toggle.
   * When true, the property is hidden from columns but can still be:
   * - Rendered via property() in formulas
   * - Available in filter picker (unless enableFilter: false)
   * - Available in sort picker (unless enableSort: false)
   * - Available in group picker (unless enableGroup: false)
   * - Included in search (unless enableSearch: false)
   * @default false
   */
  hidden?: boolean;
  /**
   * Unique identity for this property.
   * Used for React keys, filter/sort/group refs, URL params, visibility toggles.
   * Resolved via priority chain: id → key → name → index.
   * Always present after normalization.
   */
  id: string;
  /**
   * Data field accessor. Maps to `item[key]`.
   * Required for data-backed types to read values from items.
   */
  key?: string;
  /** Display name shown in UI (column headers, filter pickers, etc.) */
  name?: string;
  /**
   * Per-property override for `showPropertyNames`.
   * - `true`: Always show this property's name
   * - `false`: Always hide this property's name
   * - `undefined`: Use the global `showPropertyNames` setting
   */
  showName?: boolean;
  /**
   * Display size/width for this property (in pixels).
   * - Table: used as column width (maps to TanStack ColumnDef sizing)
   * - List: used as flex-basis for non-first properties
   * - Card (Board/Gallery): used as width hint in compact layout
   * Falls back to default behavior when omitted.
   */
  size?: number;
  type: PropertyType;
  /**
   * Per-property override for `wrapAllProperties`.
   * - `true`: Always wrap this property's value
   * - `false`: Never wrap this property's value
   * - `undefined`: Use the global `wrapAllProperties` setting
   */
  wrap?: boolean;
}

// Type-specific configurations
export type BadgeColor =
  | "gray"
  | "gray-subtle"
  | "blue"
  | "blue-subtle"
  | "purple"
  | "purple-subtle"
  | "yellow"
  | "yellow-subtle"
  | "red"
  | "red-subtle"
  | "pink"
  | "pink-subtle"
  | "green"
  | "green-subtle"
  | "teal"
  | "teal-subtle";

export interface NumberConfig {
  decimalPlaces?: number; // 0-10
  numberFormat?:
    | "number"
    | "numberWithCommas"
    | "percentage"
    | "dollar"
    | "euro"
    | "pound";
  /** Divide stored value by this for display, multiply filter input by this for query.
   *  Example: cents stored as integers → scale: 100 to display as dollars. */
  scale?: number;
  showAs?: {
    type?: "number" | "bar" | "ring"; // default: "number"
    color?: BadgeColor; // default: "green" (only used for bar/ring)
    divideBy?: number; // default: 100 (only used for bar/ring)
    showNumber?: boolean; // default: true (only used for bar/ring)
  };
}

export interface SelectOption {
  color?: BadgeColor;
  /** Display label. Falls back to `value` when omitted. */
  name?: string;
  value: string;
}

/**
 * How options are ordered in picker dropdowns.
 * - `"manual"` - Use the order as defined in options array (default)
 * - `"asc"` - Alphabetically A→Z
 * - `"desc"` - Alphabetically Z→A
 */
export type OptionOrder = "manual" | "asc" | "desc";

export interface SelectConfig {
  /** How options are ordered in picker dropdown @default "manual" */
  optionOrder?: OptionOrder;
  options: SelectOption[];
}

export interface MultiSelectConfig {
  /** How options are ordered in picker dropdown @default "manual" */
  optionOrder?: OptionOrder;
  options: SelectOption[];
}

export interface StatusGroup {
  color: BadgeColor;
  /** Optional icon component to display. Defaults to CircleDashed. */
  icon?: IconComponent;
  name: string;
  options: string[];
}

export interface StatusConfig {
  groups: StatusGroup[];
  /** How groups/options are ordered in picker dropdown @default "manual" */
  optionOrder?: OptionOrder;
}

export interface DateConfig {
  /**
   * Date format options:
   * - "full": "February 19, 2026"
   * - "short": "Feb 19, 2026"
   * - "MDY": "02/19/2026"
   * - "DMY": "19/02/2026"
   * - "YMD": "2026-02-19"
   * - "relative": "2 days ago"
   * - "relativeGroup": For group headers - converts bucket start date to label ("Today", "Last 7 days", "Aug 2025")
   */
  dateFormat?:
    | "full"
    | "short"
    | "MDY"
    | "DMY"
    | "YMD"
    | "relative"
    | "relativeGroup";
  timeFormat?: "hidden" | "12hour" | "24hour";
}

export interface UrlConfig {
  showFullUrl?: boolean;
}

// ============================================================================
// Rollup Configuration
// ============================================================================

/**
 * Aggregation calculation for rollup properties.
 * Determines how values from a related table are combined.
 */
export type RollupCalculation =
  // Display (output: array of underlying type)
  | "showOriginal"
  | "showUnique"
  // Count (output: number)
  | "countAll"
  | "countValues"
  | "countUnique"
  | "countEmpty"
  | "countNotEmpty"
  // Percent (output: number)
  | "percentEmpty"
  | "percentNotEmpty"
  // Math — only valid when underlying type is "number" (output: number)
  | "sum"
  | "average"
  | "median"
  | "min"
  | "max"
  | "range";

/**
 * Configuration for rollup properties.
 * Combines the underlying field type, aggregation calculation,
 * and optional number display options for scalar outputs.
 */
export interface RollupConfig {
  /** How to aggregate the related values */
  calculation: RollupCalculation;
  /** Date display: format */
  dateFormat?: DateConfig["dateFormat"];
  /** Number display: decimal places (0-10) */
  decimalPlaces?: NumberConfig["decimalPlaces"];
  /** Number display: format */
  numberFormat?: NumberConfig["numberFormat"];
  /** Select/status display: option definitions for colored badges */
  options?: SelectOption[];
  /** Number display: divide stored value for display */
  scale?: NumberConfig["scale"];
  /** Number display: bar/ring visualization */
  showAs?: NumberConfig["showAs"];
  /** Date display: time format */
  timeFormat?: DateConfig["timeFormat"];
  /** Underlying field type in the related table */
  type: Exclude<PropertyType, "formula" | "button" | "rollup">;
}

/**
 * Individual button action configuration.
 * Used inside button property's value function where item is already in scope.
 */
export interface ButtonAction {
  disabled?: boolean;
  icon?: IconComponent;
  isPending?: boolean;
  label: string;
  onClick: () => void;
}

/**
 * Union of all property configuration types.
 * Used by PropertyMeta for covariant type safety.
 */
export type PropertyConfig =
  | NumberConfig
  | SelectConfig
  | MultiSelectConfig
  | StatusConfig
  | DateConfig
  | UrlConfig
  | RollupConfig;

// ============================================================================
// PropertyMeta - Covariant Property Type for UI Components
// ============================================================================

/**
 * Covariant property metadata type - safe to pass to any component.
 *
 * This type excludes the `value` function which causes TypeScript contravariance issues.
 * Use PropertyMeta when components only need property metadata (id, type, name, config)
 * but don't need to call the value function.
 *
 * @example
 * // UI components that display property info use PropertyMeta
 * interface SortChipProps {
 *   properties: readonly PropertyMeta[];
 * }
 *
 * // Data components that render values use DataViewProperty<T>
 * interface TableViewProps<T> {
 *   properties: DataViewProperty<T>[];
 * }
 */
export interface PropertyMeta {
  /** Type-specific configuration */
  config?: PropertyConfig;
  /** Enable filtering @default true */
  enableFilter?: boolean;
  /** Enable grouping @default true */
  enableGroup?: boolean;
  /** Enable search @default type-dependent */
  enableSearch?: boolean;
  /** Enable sorting @default true */
  enableSort?: boolean;
  /** Hide from visibility toggle and columns @default false */
  hidden?: boolean;
  /** Unique identifier for this property (always resolved after normalization) */
  id: string;
  /** Data field accessor (undefined for formula/button) */
  key?: string;
  /** Display name shown in UI */
  name?: string;
  /** Per-property override for showPropertyNames */
  showName?: boolean;
  /** Display size/width in pixels */
  size?: number;
  /** Property type for rendering */
  type: PropertyType;
  /** Per-property override for wrapAllProperties */
  wrap?: boolean;
}

/**
 * Convert a DataViewProperty to PropertyMeta by stripping formula-specific fields.
 * Safe to call with any property type.
 */
export function toPropertyMeta<T>(property: DataViewProperty<T>): PropertyMeta {
  // Use type assertion to access value/sortBy which only exist on FormulaPropertyType
  const { value, sortBy, ...meta } = property as DataViewProperty<T> & {
    value?: unknown;
    sortBy?: unknown;
  };
  return meta as PropertyMeta;
}

/**
 * Convert an array of DataViewProperty to PropertyMeta[].
 * Use this in DataViewProvider to create the propertyMetas context value.
 */
export function toPropertyMetaArray<T>(
  properties: readonly DataViewProperty<T>[]
): PropertyMeta[] {
  return properties.map(toPropertyMeta);
}

// Property type definitions with discriminated unions
export type TextPropertyType<T> = BaseProperty<T> & {
  type: "text";
  config?: never;
};

export type NumberPropertyType<T> = BaseProperty<T> & {
  type: "number";
  config?: NumberConfig;
};

export type SelectPropertyType<T> = BaseProperty<T> & {
  type: "select";
  config?: SelectConfig; // Optional - auto-generates badges if not defined
};

export type MultiSelectPropertyType<T> = BaseProperty<T> & {
  type: "multiSelect";
  config?: MultiSelectConfig; // Optional - auto-generates badges if not defined
};

export type StatusPropertyType<T> = BaseProperty<T> & {
  type: "status";
  config?: StatusConfig; // Optional - auto-generates badges if not defined
};

export type DatePropertyType<T> = BaseProperty<T> & {
  type: "date";
  config?: DateConfig;
};

export type FilesMediaPropertyType<T> = BaseProperty<T> & {
  type: "filesMedia";
  config?: never;
};

export type CheckboxPropertyType<T> = BaseProperty<T> & {
  type: "checkbox";
  config?: never;
};

export type UrlPropertyType<T> = BaseProperty<T> & {
  type: "url";
  config?: UrlConfig;
};

export type EmailPropertyType<T> = BaseProperty<T> & {
  type: "email";
  config?: never;
};

export type PhonePropertyType<T> = BaseProperty<T> & {
  type: "phone";
  config?: never;
};

/**
 * Property render function for formula properties.
 * Renders a property with its full styling and config.
 *
 * @param id - Property ID to render
 * @returns ReactNode with styled property display
 */
// biome-ignore lint/suspicious/noExplicitAny: Returns ReactNode but using any for simpler type inference
export type PropertyRenderFunction = (id: string) => any;

/**
 * Formula property type - renders composite values using other properties.
 *
 * The `value` function receives:
 * - `property(id)` - Renders the property with styling (ReactNode)
 * - `item` - The data item with direct property access
 *
 * @example
 * ```tsx
 * {
 *   id: "productSummary",
 *   type: "formula",
 *   name: "Product",
 *   sortBy: "name",
 *   value: (property, item) => {
 *     const minPrice = item.minPrice;
 *     return (
 *       <div className="flex flex-col gap-1">
 *         {property("name")}
 *         {minPrice > 5000 && <span className="text-red-500 text-xs">Premium</span>}
 *       </div>
 *     );
 *   },
 * }
 * ```
 */
export type FormulaPropertyType<T> = BaseProperty<T> & {
  type: "formula";
  config?: never;
  /**
   * Formula value function.
   *
   * @param property - Function to render a property with its full config
   * @param item - The data item for direct property access
   * @returns ReactNode to render in the cell
   *
   * Uses method syntax for bivariant parameter types (allows DataViewProperty<T> to be assigned to DataViewProperty<unknown>)
   */
  value?(
    property: PropertyRenderFunction,
    item: T
    // biome-ignore lint/suspicious/noExplicitAny: Flexible signature to avoid type inference issues with union types
  ): any;
  /**
   * Optional: which property to use for sorting this formula column.
   * Since formulas can't be sorted directly, this specifies a backing property.
   * Uses `string` instead of `keyof T` for type variance compatibility.
   */
  sortBy?: string;
};

/**
 * Button property type - renders action buttons in any column position.
 * Unlike rowActions which are tied to row selection and bulk operations,
 * button properties are independent per-row actions.
 *
 * @example
 * ```tsx
 * // Button — id required, no key (no data field)
 * {
 *   id: "actions",
 *   type: "button",
 *   name: "Actions",
 *   value: (item) => [
 *     { label: "View", icon: Eye, onClick: () => viewItem(item) },
 *     { label: "Edit", icon: Edit, onClick: () => editItem(item) },
 *   ],
 * }
 * ```
 */
export type ButtonPropertyType<T> = BaseProperty<T> & {
  type: "button";
  config?: never;
  /**
   * Button value function.
   *
   * @param item - The row data item
   * @returns Array of button actions to render
   */
  // Using method syntax for bivariant parameter types (allows DataViewProperty<T> to be assigned to DataViewProperty<unknown>)
  value(item: T): ButtonAction[];
};

/**
 * Rollup property type — aggregates values from a related table.
 * The `config.type` specifies the underlying field type, and
 * `config.calculation` determines how values are aggregated.
 *
 * @example
 * ```tsx
 * // Show all variant SKUs as a list
 * {
 *   key: "listingVariants.sku",
 *   name: "Variant SKUs",
 *   type: "rollup",
 *   config: { type: "text", calculation: "showOriginal" },
 * }
 *
 * // Sum of variant quantities with dollar formatting
 * {
 *   key: "listingVariants.quantity",
 *   name: "Total Inventory",
 *   type: "rollup",
 *   config: { type: "number", calculation: "sum", numberFormat: "dollar" },
 * }
 * ```
 */
export type RollupPropertyType<T> = BaseProperty<T> & {
  type: "rollup";
  config: RollupConfig;
};

/**
 * Main type for defining data view properties (resolved — id always present).
 * Used throughout the system after normalization.
 */
export type DataViewProperty<T> =
  | TextPropertyType<T>
  | NumberPropertyType<T>
  | SelectPropertyType<T>
  | MultiSelectPropertyType<T>
  | StatusPropertyType<T>
  | DatePropertyType<T>
  | FilesMediaPropertyType<T>
  | CheckboxPropertyType<T>
  | UrlPropertyType<T>
  | EmailPropertyType<T>
  | PhonePropertyType<T>
  | FormulaPropertyType<T>
  | ButtonPropertyType<T>
  | RollupPropertyType<T>;

/**
 * Extract property IDs from a property array
 * Use this to get type-safe property visibility IDs
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic type parameter for property array extraction
export type PropertyKeys<T extends readonly DataViewProperty<any>[]> =
  T[number]["id"];

// Re-export filter types for unified system
export type {
  FilterCondition,
  SearchWhereClause,
  SortQuery,
  WhereExpression,
  WhereNode,
  WhereRule,
} from "./filter.type";

/**
 * Returns true if the property is a display rollup (showOriginal / showUnique).
 * Display rollups return arrays and support array quantifier filters (any/none/every).
 */
export function isDisplayRollup(property: PropertyMeta): boolean {
  if (property.type !== "rollup") {
    return false;
  }
  const config = property.config as RollupConfig;
  return (
    config.calculation === "showOriginal" || config.calculation === "showUnique"
  );
}

/**
 * Derives the effective output type for a property.
 * For non-rollup properties, returns the property type directly.
 * For rollup properties:
 * - show_original / show_unique → underlying config.type (value is an array)
 * - All other calculations → "number" (scalar aggregation result)
 *
 * Used by filter, sort, and rendering layers to determine behavior.
 */
export function getEffectiveType(property: PropertyMeta): PropertyType {
  if (property.type !== "rollup") {
    return property.type;
  }
  const config = property.config as RollupConfig;
  if (
    config.calculation === "showOriginal" ||
    config.calculation === "showUnique"
  ) {
    return config.type;
  }
  return "number";
}

/** Property types excluded from search by default */
const EXCLUDED_SEARCH_TYPES: PropertyType[] = [
  "filesMedia",
  "checkbox",
  "formula",
  "button",
  "rollup",
];

/**
 * Extract data field keys that should be included in search queries.
 *
 * Default behavior by type:
 * - Included: text, url, email, phone, number, select, multiSelect, status, date
 * - Excluded: filesMedia, checkbox, formula, button
 *
 * Override with `enableSearch: true/false` on individual properties.
 *
 * @returns Array of data field keys (property.key) for searchable properties
 *
 * @example
 * const searchableFields = getSearchableProperties(productProperties);
 * // Returns: ["name", "tag", "type", ...] (all non-excluded types)
 */
export function getSearchableProperties<T>(
  properties: DataViewProperty<T>[]
): string[] {
  return properties
    .filter((p) => {
      // Explicit false → exclude
      if (p.enableSearch === false) {
        return false;
      }
      // Explicit true → include
      if (p.enableSearch === true) {
        return true;
      }
      // Default: include unless type is in excluded list
      return !EXCLUDED_SEARCH_TYPES.includes(p.type);
    })
    .map((p) => p.key ?? p.id)
    .filter((key): key is string => key !== undefined);
}

/**
 * Extract scalar rollup definitions from properties.
 * Returns `{ key, calculation }` for each rollup property that uses a scalar
 * calculation (not showOriginal/showUnique). These are passed to the server
 * to compute as SQL extras.
 */
export function getScalarRollups<T>(
  properties: readonly DataViewProperty<T>[]
): { extrasKey: string; key: string; calculation: string }[] {
  const scalars = properties.filter((p): p is RollupPropertyType<T> => {
    if (p.type !== "rollup") {
      return false;
    }
    const config = p.config as RollupConfig;
    return (
      config.calculation !== "showOriginal" &&
      config.calculation !== "showUnique"
    );
  });

  return scalars.map((p) => {
    const key = p.key ?? p.id;
    const id = p.id ?? p.key ?? p.name ?? "";
    // Always append id with _ to avoid collisions with display rollups sharing the same key
    const extrasKey = `${key}_${id}`;
    return {
      extrasKey,
      key,
      calculation: (p.config as RollupConfig).calculation,
    };
  });
}

// Sort configuration (simple client-side sorting)
export interface SortConfig<T> {
  direction: "asc" | "desc";
  propertyKey: keyof T;
}

// View configuration
export interface ViewConfig<
  T,
  TProperties extends readonly DataViewProperty<T>[] = DataViewProperty<T>[],
> {
  filter?: WhereNode | null;
  groupBy?: keyof T;
  properties: TProperties;
  propertyVisibility?: PropertyKeys<TProperties>[];
  searchQuery?: string;
  sort?: SortConfig<T>;
}
