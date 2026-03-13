import { z } from "zod";

// =============================================================================
// Show As Options (Zod schemas)
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

// =============================================================================
// Number Range
// =============================================================================

export const numberRangeSchema = z.object({
  range: z.tuple([z.number(), z.number()]),
  step: z.number().positive(),
});

// =============================================================================
// Property Type Schema
// =============================================================================

export const propertyTypeSchema = z.enum([
  "date",
  "status",
  "select",
  "multiSelect",
  "checkbox",
  "text",
  "number",
]);

// =============================================================================
// Individual Group Config Schemas (propertyType discriminant)
// =============================================================================

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

// =============================================================================
// Discriminated Union for Group-By Config
// =============================================================================

export const groupByConfigSchema = z.discriminatedUnion("propertyType", [
  dateGroupBySchema,
  statusGroupBySchema,
  selectGroupBySchema,
  multiSelectGroupBySchema,
  checkboxGroupBySchema,
  textGroupBySchema,
  numberGroupBySchema,
]);

// =============================================================================
// Group Options
// =============================================================================

export const groupSortSchema = z.enum(["asc", "desc"]);

export const groupOptionsSchema = z.object({
  hideEmpty: z.boolean().optional(),
  showCount: z.boolean().optional(),
  sort: groupSortSchema.optional(),
});

// =============================================================================
// Full Group Config (GroupBy + Options)
// =============================================================================

export const groupConfigInputSchema =
  groupByConfigSchema.and(groupOptionsSchema);

// =============================================================================
// Column Config (GroupBy + Options - same as Group for consistency)
// =============================================================================

export const columnConfigInputSchema = groupConfigInputSchema;

// =============================================================================
// Type Exports (use canonical types from group-config.ts)
// =============================================================================

// Re-export canonical types
export type {
  GroupablePropertyType,
  GroupByConfig,
  GroupConfigInput,
  ParsedGroupConfig,
} from "./group-config";

// Zod-inferred types (should match canonical types)
export type GroupByConfigSchema = z.infer<typeof groupByConfigSchema>;
export type GroupConfigInputSchema = z.infer<typeof groupConfigInputSchema>;
export type ColumnConfigInputSchema = z.infer<typeof columnConfigInputSchema>;

// =============================================================================
// Adapter Function (Re-export)
// =============================================================================

// biome-ignore lint/performance/noBarrelFile: Re-exporting adapter from canonical module
export { toParsedGroupConfig } from "./group-config";
