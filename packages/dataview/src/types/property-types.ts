import type { WhereNode } from "@ocean-dataview/shared/types";

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
	| "formula";

// Base property structure
export interface BaseProperty<T> {
	/**
	 * Unique identifier for this property
	 * No longer needs to correspond to a field in the data object
	 */
	id: string;
	label?: string;
	type: PropertyType;
	/**
	 * Optional value transformation function
	 * Transform values before rendering
	 * @param item - The full data item with properly typed properties
	 * @returns Transformed value to be passed to property component
	 */
	value?: (item: T) => unknown;

	// ===== Constraint fields (all default to true) =====

	/**
	 * Show as column & in visibility toggle.
	 * When false, the property is hidden from columns but can still be:
	 * - Rendered via property() in formulas
	 * - Available in filter picker (unless filter: false)
	 * - Available in sort picker (unless sort: false)
	 * - Included in search (unless search: false)
	 * @default true
	 */
	visibility?: boolean;

	/**
	 * Show in filter picker.
	 * When false, property won't appear in the filter dropdown.
	 * @default true
	 */
	filter?: boolean;

	/**
	 * Show in sort picker.
	 * When false, property won't appear in the sort dropdown.
	 * @default true
	 */
	sort?: boolean;

	/**
	 * Include in search queries.
	 * - `true`: Include in search (even if type would be excluded by default)
	 * - `false`: Exclude from search (even if type would be included by default)
	 * - `undefined`: Use type-based default (excluded: filesMedia, checkbox, formula)
	 * @default true (except filesMedia, checkbox, formula which default to false)
	 */
	search?: boolean;
}

// Type-specific configurations
export interface NumberConfig {
	numberFormat?:
		| "number"
		| "numberWithCommas"
		| "percentage"
		| "dollar"
		| "euro"
		| "pound";
	decimalPlaces?: number; // 0-10
	showAs?:
		| "number"
		| {
				type: "bar" | "ring";
				color: string;
				divideBy: number;
				showNumber: boolean;
		  };
}

export interface SelectOption {
	value: string;
	label: string;
	color?:
		| "gray"
		| "blue"
		| "purple"
		| "yellow"
		| "red"
		| "pink"
		| "green"
		| "teal";
}

export interface SelectConfig {
	options: SelectOption[];
}

export interface MultiSelectConfig {
	options: SelectOption[];
	displayLimit?: number;
}

export interface StatusOption {
	value: string;
	label: string;
	group: "todo" | "inProgress" | "complete" | "canceled";
}

export interface StatusConfig {
	options: StatusOption[];
}

export interface DateConfig {
	dateFormat?: "full" | "short" | "MDY" | "DMY" | "YMD" | "relative";
	timeFormat?: "hidden" | "12hour" | "24hour";
}

export interface UrlConfig {
	showFullUrl?: boolean;
}

export interface EmailConfig {
	showAsLink?: boolean;
}

export interface PhoneConfig {
	showAsLink?: boolean;
	format?: "US" | "international" | "none";
}

export interface FilesMediaConfig {
	displayAs?: "thumbnail" | "list" | "gallery";
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
	| EmailConfig
	| PhoneConfig
	| FilesMediaConfig;

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
	/** Unique identifier for this property */
	id: string;
	/** Property type for rendering */
	type: PropertyType;
	/** Display label */
	label?: string;
	/** Type-specific configuration */
	config?: PropertyConfig;
	/** Show in visibility toggle and as column @default true */
	visibility?: boolean;
	/** Show in filter picker @default true */
	filter?: boolean;
	/** Show in sort picker @default true */
	sort?: boolean;
	/** Include in search @default type-dependent */
	search?: boolean;
}

/**
 * Convert a DataViewProperty to PropertyMeta by stripping contravariant fields.
 * Safe to call with any property type.
 */
export function toPropertyMeta<T>(property: DataViewProperty<T>): PropertyMeta {
	// Use type assertion to access sortBy which only exists on FormulaPropertyType
	const { value, sortBy, ...meta } = property as DataViewProperty<T> & {
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
	config?: FilesMediaConfig;
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
	config?: EmailConfig;
};

export type PhonePropertyType<T> = BaseProperty<T> & {
	type: "phone";
	config?: PhoneConfig;
};

/**
 * Property renderer function type for formula properties.
 * Call with a property ID to render that property's value with its full config.
 */
// biome-ignore lint/suspicious/noExplicitAny: Returns ReactNode but using any for simpler type inference
export type PropertyRenderer = (id: string) => any;

/**
 * Formula property type - renders composite values using other properties.
 *
 * The `value` function receives:
 * - `property`: A renderer function that takes a property ID and returns the rendered JSX
 * - `data`: The raw data item for conditional logic and manual property access
 *
 * @example
 * ```tsx
 * // Using property() renderer for automatic config application
 * {
 *   id: "productName",
 *   type: "formula",
 *   label: "Product",
 *   sortBy: "name",
 *   filter: false,
 *   sort: false,
 *   value: (property, data) => (
 *     <div className="flex flex-col gap-1">
 *       {property("name")}        // Rendered with text styling
 *       {property("familyGroup")} // Rendered with select colors
 *       {data.minCalories > 500 && (
 *         <span className="text-red-500 text-xs">High cal</span>
 *       )}
 *     </div>
 *   ),
 * }
 *
 * // Using Property components for manual composition
 * {
 *   id: "summary",
 *   type: "formula",
 *   value: (_, data) => (
 *     <div className="flex gap-2">
 *       <Property.Text value={data.title} />
 *       <Property.Number value={data.price} config={{ numberFormat: "dollar" }} />
 *     </div>
 *   ),
 * }
 * ```
 */
export type FormulaPropertyType<T> = Omit<BaseProperty<T>, "value"> & {
	type: "formula";
	config?: never;
	/**
	 * Formula value function.
	 *
	 * @param property - Renderer function: `property(id)` renders a property with its full config
	 * @param data - The raw data item for conditional logic and manual property access
	 * @returns ReactNode to render in the cell
	 */
	// biome-ignore lint/suspicious/noExplicitAny: Flexible signature to avoid type inference issues with union types
	value?: (property: PropertyRenderer, data: any) => any;
	/**
	 * Optional: which property to use for sorting this formula column.
	 * Since formulas can't be sorted directly, this specifies a backing property.
	 */
	sortBy?: keyof T;
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
	| FormulaPropertyType<T>;

/**
 * Extract property IDs from a property array
 * Use this to get type-safe property visibility IDs
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic type parameter for property array extraction
export type PropertyKeys<T extends readonly DataViewProperty<any>[]> =
	T[number]["id"];

// Re-export filter types from shared package for unified system
export type {
	FilterCondition,
	FilterQuery,
	FilterVariant,
	PropertySort,
	SearchQuery,
	WhereExpression,
	WhereNode,
	WhereRule,
} from "@ocean-dataview/shared/types";

/** Property types excluded from search by default */
const EXCLUDED_SEARCH_TYPES: PropertyType[] = [
	"filesMedia",
	"checkbox",
	"formula",
];

/**
 * Extract property IDs that should be included in search queries.
 *
 * Default behavior by type:
 * - Included: text, url, email, phone, number, select, multiSelect, status, date
 * - Excluded: filesMedia, checkbox, formula
 *
 * Override with `search: true/false` on individual properties.
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
			if (p.search === false) {
				return false;
			}
			// Explicit true → include
			if (p.search === true) {
				return true;
			}
			// Default: include unless type is in excluded list
			return !EXCLUDED_SEARCH_TYPES.includes(p.type);
		})
		.map((p) => p.id);
}

// Sort configuration (simple client-side sorting)
export interface SortConfig<T> {
	propertyKey: keyof T;
	direction: "asc" | "desc";
}

// View configuration
export interface ViewConfig<
	T,
	TProperties extends readonly DataViewProperty<T>[] = DataViewProperty<T>[],
> {
	properties: TProperties;
	propertyVisibility?: PropertyKeys<TProperties>[];
	filter?: WhereNode | null;
	sort?: SortConfig<T>;
	groupBy?: keyof T;
	searchQuery?: string;
}
