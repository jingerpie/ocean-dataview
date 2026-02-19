import type { product } from "@sparkyidea/db/schema";

type ProductColumns = keyof typeof product.$inferSelect;

/**
 * Columns that support server-side GROUP BY queries.
 * These are columns where SQL GROUP BY makes sense (discrete values).
 *
 * Note: Date, text alphabetical, and number range grouping are client-side only.
 */
export const productGroupableColumns = [
  "category", // select
  "availability", // status
  "featured", // checkbox
] as const satisfies readonly ProductColumns[];

export type ProductGroupableColumn = (typeof productGroupableColumns)[number];
