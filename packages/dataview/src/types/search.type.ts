import { z } from "zod";
import type { WhereRule } from "./filter.type";
import { whereRuleSchema } from "./filter.type";

/**
 * Search parameter - always OR at root, flat (no nesting)
 */
export interface SearchQuery {
  or: WhereRule[];
}

/**
 * Schema for SearchQuery - always { or: WhereRule[] }
 */
export const searchQuerySchema: z.ZodType<SearchQuery> = z.object({
  or: z.array(whereRuleSchema),
});

/**
 * Validated search output from `validateSearch()`.
 * Contains the trimmed search string and the searchable field IDs
 * derived from properties with `enableSearch`.
 */
export interface ValidatedSearch {
  search: string;
  searchFields: string[];
}
