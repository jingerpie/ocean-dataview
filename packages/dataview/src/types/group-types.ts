// Property-specific group configs

/** Date grouping configuration */
export interface DateGroupConfig {
  property: string;
  showAs: "day" | "week" | "month" | "year" | "relative";
  startWeekOn?: "monday" | "sunday";
}

/** Status grouping configuration */
export interface StatusGroupConfig {
  property: string;
  showAs: "option" | "group";
}

/** Select grouping configuration */
export interface SelectGroupConfig {
  property: string;
}

/** MultiSelect grouping configuration */
export interface MultiSelectGroupConfig {
  property: string;
}

/** Checkbox grouping configuration */
export interface CheckboxGroupConfig {
  property: string;
}

/** Text/URL/Email/Phone grouping configuration */
export interface TextGroupConfig {
  property: string;
  showAs?: "exact" | "alphabetical";
}

/** Number grouping configuration */
export interface NumberGroupConfig {
  property: string;
  showAs?: { range: [number, number]; step: number };
}

// Discriminated union for group-by config
export type GroupByConfig =
  | { byDate: DateGroupConfig }
  | { byStatus: StatusGroupConfig }
  | { bySelect: SelectGroupConfig }
  | { byMultiSelect: MultiSelectGroupConfig }
  | { byCheckbox: CheckboxGroupConfig }
  | { byText: TextGroupConfig }
  | { byNumber: NumberGroupConfig };

// Shared options for all group configs
export interface SharedGroupOptions {
  hideEmpty?: boolean;
  showCount?: boolean;
  sort?: "asc" | "desc";
}

// Final group config type
export type GroupConfig = GroupByConfig & SharedGroupOptions;

// SubGroup uses same structure
export type SubGroupConfig = GroupByConfig & SharedGroupOptions;
