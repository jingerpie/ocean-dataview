/**
 * Computation types for aggregating numeric values in charts and grouping.
 * Extracted to a pure type file to avoid pulling runtime dependencies into type imports.
 */
export type ComputationType =
  | "count"
  | "sum"
  | "average"
  | "min"
  | "max"
  | "median"
  | "distinct";
