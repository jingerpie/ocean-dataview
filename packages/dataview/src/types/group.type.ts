/**
 * GroupBy types for dataview package (source of truth).
 */

import { z } from "zod";

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

// =============================================================================
// Zod Schemas
// =============================================================================

export const dateShowAsSchema = z.enum([
  "day",
  "week",
  "month",
  "year",
  "relative",
]);

export const statusShowAsSchema = z.enum(["option", "group"]);

export const textShowAsSchema = z.enum(["exact", "alphabetical"]);

export const weekStartDaySchema = z.enum(["monday", "sunday"]);

export const numberRangeSchema = z.object({
  range: z.tuple([z.number(), z.number()]),
  step: z.number().positive(),
});

export const propertyTypeSchema = z.enum([
  "date",
  "status",
  "select",
  "multiSelect",
  "checkbox",
  "text",
  "number",
]);

const dateGroupBySchema = z.object({
  propertyType: z.literal("date"),
  propertyId: z.string(),
  showAs: dateShowAsSchema,
  startWeekOn: weekStartDaySchema.optional(),
});

const statusGroupBySchema = z.object({
  propertyType: z.literal("status"),
  propertyId: z.string(),
  showAs: statusShowAsSchema.optional(),
});

const selectGroupBySchema = z.object({
  propertyType: z.literal("select"),
  propertyId: z.string(),
});

const multiSelectGroupBySchema = z.object({
  propertyType: z.literal("multiSelect"),
  propertyId: z.string(),
});

const checkboxGroupBySchema = z.object({
  propertyType: z.literal("checkbox"),
  propertyId: z.string(),
});

const textGroupBySchema = z.object({
  propertyType: z.literal("text"),
  propertyId: z.string(),
  showAs: textShowAsSchema.optional(),
});

const numberGroupBySchema = z.object({
  propertyType: z.literal("number"),
  propertyId: z.string(),
  numberRange: numberRangeSchema.optional(),
});

export const groupByConfigSchema = z.discriminatedUnion("propertyType", [
  dateGroupBySchema,
  statusGroupBySchema,
  selectGroupBySchema,
  multiSelectGroupBySchema,
  checkboxGroupBySchema,
  textGroupBySchema,
  numberGroupBySchema,
]);

export const groupSortSchema = z.enum(["asc", "desc"]);

export const groupOptionsSchema = z.object({
  hideEmpty: z.boolean().optional(),
  showCount: z.boolean().optional(),
  sort: groupSortSchema.optional(),
});

export const groupConfigInputSchema =
  groupByConfigSchema.and(groupOptionsSchema);

export const columnConfigInputSchema = groupConfigInputSchema;

// Zod-inferred types (should match canonical types)
export type GroupByConfigSchema = z.infer<typeof groupByConfigSchema>;
export type GroupConfigInputSchema = z.infer<typeof groupConfigInputSchema>;
export type ColumnConfigInputSchema = z.infer<typeof columnConfigInputSchema>;
