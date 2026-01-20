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
	/**
	 * Override default search behavior for this property.
	 * - `true`: Include in search (even if type would be excluded by default)
	 * - `false`: Exclude from search (even if type would be included by default)
	 * - `undefined`: Use type-based default (excluded: filesMedia, checkbox, formula)
	 */
	allowSearch?: boolean;
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

export type FormulaPropertyType<T> = BaseProperty<T> & {
	type: "formula";
	config?: never;
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
 * Override with `allowSearch: true/false` on individual properties.
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
			if (p.allowSearch === false) {
				return false;
			}
			// Explicit true → include
			if (p.allowSearch === true) {
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
