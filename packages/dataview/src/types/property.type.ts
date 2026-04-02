import type { ComponentType, SVGProps } from "react";

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
  | "button";

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
   * Unique identifier for this property.
   * Must correspond to a field in the data object (except for formula type).
   */
  id: string;
  label?: string;
  type: PropertyType;
}

// Type-specific configurations
export type BadgeColor =
  | "gray"
  | "blue"
  | "purple"
  | "yellow"
  | "red"
  | "pink"
  | "green"
  | "teal";

export interface NumberConfig {
  decimalPlaces?: number; // 0-10
  numberFormat?:
    | "number"
    | "numberWithCommas"
    | "percentage"
    | "dollar"
    | "euro"
    | "pound";
  showAs?: {
    type?: "number" | "bar" | "ring"; // default: "number"
    color?: BadgeColor; // default: "green" (only used for bar/ring)
    divideBy?: number; // default: 100 (only used for bar/ring)
    showNumber?: boolean; // default: true (only used for bar/ring)
  };
}

export interface SelectOption {
  color?: BadgeColor;
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
  label: string;
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
  | UrlConfig;

// ============================================================================
// PropertyMeta - Covariant Property Type for UI Components
// ============================================================================

/**
 * Covariant property metadata type - safe to pass to any component.
 *
 * This type excludes the `value` function which causes TypeScript contravariance issues.
 * Use PropertyMeta when components only need property metadata (id, type, label, config)
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
  /** Unique identifier for this property */
  id: string;
  /** Display label */
  label?: string;
  /** Property type for rendering */
  type: PropertyType;
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
 * - `item` - The raw data item for direct field access
 *
 * @example
 * ```tsx
 * // Using property() for rendering and item for data access
 * {
 *   id: "productSummary",
 *   type: "formula",
 *   label: "Product",
 *   sortBy: "name",
 *   value: (property, item) => (
 *     <div className="flex flex-col gap-1">
 *       {property("name")}        // Rendered with text styling
 *       {property("familyGroup")} // Rendered with select colors
 *       {item.minCalories > 500 && (
 *         <span className="text-red-500 text-xs">High cal</span>
 *       )}
 *     </div>
 *   ),
 * }
 *
 * // Using property components directly for manual composition
 * // import { TextProperty, NumberProperty } from "@sparkyidea/dataview/components/ui/properties";
 * {
 *   id: "summary",
 *   type: "formula",
 *   value: (property, item) => (
 *     <div className="flex gap-2">
 *       <TextProperty value={item.title} />
 *       <NumberProperty value={item.price} config={{ numberFormat: "dollar" }} />
 *     </div>
 *   ),
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
   * @param item - The raw data item for direct field access
   * @returns ReactNode to render in the cell
   *
   * Uses method syntax for bivariant parameter types (allows DataViewProperty<T> to be assigned to DataViewProperty<unknown>)
   */
  // biome-ignore lint/suspicious/noExplicitAny: Flexible signature to avoid type inference issues with union types
  value?(property: PropertyRenderFunction, item: T): any;
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
 * {
 *   id: "actions",
 *   type: "button",
 *   label: "Actions",
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
 * Main type for defining data view properties
 * Union of all property types
 * Use this when defining property arrays: DataViewProperty<YourType>[]
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
  | ButtonPropertyType<T>;

/**
 * Extract property IDs from a property array
 * Use this to get type-safe property visibility IDs
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic type parameter for property array extraction
export type PropertyKeys<T extends readonly DataViewProperty<any>[]> =
  T[number]["id"];
