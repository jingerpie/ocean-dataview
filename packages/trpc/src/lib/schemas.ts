import {
  cursorValueSchema,
  groupByConfigSchema,
  whereNodeSchema,
} from "@sparkyidea/dataview/types";
import { z } from "zod";

/** Search input: search string + searchable field IDs (derived from properties on client) */
const searchSchema = z
  .object({
    search: z.string(),
    searchFields: z.array(z.string()),
  })
  .nullish();

/** Sort input: array of property + direction pairs */
const sortSchema = z
  .array(
    z.object({
      property: z.string(),
      direction: z.enum(["asc", "desc"]),
    })
  )
  .default([]);

/** Filter input: WhereNode array */
const filterSchema = z.array(whereNodeSchema).nullish();

/** Shared query fields for getMany-style procedures */
export const getManyInput = z.object({
  cursor: z.union([cursorValueSchema, z.string()]).optional(),
  filter: filterSchema,
  limit: z.number().int().min(1).max(100).default(25),
  search: searchSchema,
  sort: sortSchema,
});

/** Shared query fields for getManyByColumn procedures */
export const getManyByColumnInput = z.object({
  columnBy: groupByConfigSchema,
  columnKeys: z.array(z.string()).optional(),
  cursor: z.record(z.string(), z.string().nullable()).default({}),
  filter: filterSchema,
  limit: z.number().int().min(1).max(100).default(10),
  search: searchSchema,
  sort: sortSchema,
});

/** Shared query fields for getGroup procedures */
export const getGroupInput = z.object({
  cursor: z.string().nullable().optional(),
  filter: filterSchema,
  groupBy: groupByConfigSchema,
  hideEmpty: z.boolean().default(false),
  limit: z.number().int().min(1).max(100).default(25),
  search: searchSchema,
  sort: z.enum(["asc", "desc"]).optional(),
});
