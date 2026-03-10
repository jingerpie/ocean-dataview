import { z } from "zod";

// Date grouping showAs options
export const dateShowAsSchema = z.enum([
  "day",
  "week",
  "month",
  "year",
  "relative",
]);
export type DateShowAs = z.infer<typeof dateShowAsSchema>;

// Status grouping showAs options
export const statusShowAsSchema = z.enum(["option", "group"]);
export type StatusShowAs = z.infer<typeof statusShowAsSchema>;

// Text grouping showAs options
export const textShowAsSchema = z.enum(["exact", "alphabetical"]);
export type TextShowAs = z.infer<typeof textShowAsSchema>;

// Number range config
export const numberRangeSchema = z.object({
  range: z.tuple([z.number(), z.number()]),
  step: z.number().positive(),
});
export type NumberRange = z.infer<typeof numberRangeSchema>;

// Individual group config schemas
export const byDateConfigSchema = z.object({
  property: z.string(),
  showAs: dateShowAsSchema,
  startWeekOn: z.enum(["monday", "sunday"]).optional(),
});

export const byStatusConfigSchema = z.object({
  property: z.string(),
  showAs: statusShowAsSchema.optional().default("option"),
});

export const bySelectConfigSchema = z.object({
  property: z.string(),
});

export const byMultiSelectConfigSchema = z.object({
  property: z.string(),
});

export const byCheckboxConfigSchema = z.object({
  property: z.string(),
});

export const byTextConfigSchema = z.object({
  property: z.string(),
  showAs: textShowAsSchema.optional().default("exact"),
});

export const byNumberConfigSchema = z.object({
  property: z.string(),
  showAs: numberRangeSchema.optional(),
});

// Discriminated union for group-by config (matching dataview types)
export const groupByConfigSchema = z.union([
  z.object({ byDate: byDateConfigSchema }),
  z.object({ byStatus: byStatusConfigSchema }),
  z.object({ bySelect: bySelectConfigSchema }),
  z.object({ byMultiSelect: byMultiSelectConfigSchema }),
  z.object({ byCheckbox: byCheckboxConfigSchema }),
  z.object({ byText: byTextConfigSchema }),
  z.object({ byNumber: byNumberConfigSchema }),
]);

export type GroupByConfigInput = z.infer<typeof groupByConfigSchema>;

// Sort direction schema
export const groupSortSchema = z.enum(["asc", "desc"]);
export type GroupSort = z.infer<typeof groupSortSchema>;

// Full group config with sort (for server-side sorting)
export const groupConfigSchema = groupByConfigSchema.and(
  z.object({
    sort: groupSortSchema.optional(),
  })
);

export type GroupConfigSchemaInput = z.infer<typeof groupConfigSchema>;

// Parsed group config (normalized format for processing)
export interface ParsedGroupConfig {
  numberRange?: { range: [number, number]; step: number };
  property: string;
  propertyType:
    | "date"
    | "status"
    | "select"
    | "multiSelect"
    | "checkbox"
    | "text"
    | "number";
  showAs?: "day" | "week" | "month" | "year" | "relative" | "group" | "option";
  startWeekOn?: "monday" | "sunday";
  textShowAs?: "exact" | "alphabetical";
}

/**
 * Parse discriminated union config into normalized format
 */
export function parseGroupByConfig(
  config: GroupByConfigInput
): ParsedGroupConfig {
  if ("byDate" in config) {
    return {
      property: config.byDate.property,
      propertyType: "date",
      showAs: config.byDate.showAs,
      startWeekOn: config.byDate.startWeekOn,
    };
  }
  if ("byStatus" in config) {
    return {
      property: config.byStatus.property,
      propertyType: "status",
      showAs: config.byStatus.showAs,
    };
  }
  if ("bySelect" in config) {
    return {
      property: config.bySelect.property,
      propertyType: "select",
    };
  }
  if ("byMultiSelect" in config) {
    return {
      property: config.byMultiSelect.property,
      propertyType: "multiSelect",
    };
  }
  if ("byCheckbox" in config) {
    return {
      property: config.byCheckbox.property,
      propertyType: "checkbox",
    };
  }
  if ("byText" in config) {
    return {
      property: config.byText.property,
      propertyType: "text",
      textShowAs: config.byText.showAs ?? "exact",
    };
  }
  if ("byNumber" in config) {
    return {
      property: config.byNumber.property,
      propertyType: "number",
      numberRange: config.byNumber.showAs,
    };
  }
  throw new Error("Invalid group config: no recognized byXXX key found");
}
