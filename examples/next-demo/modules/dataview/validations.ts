import type { ColumnConfigInput } from "@jingerpie/dataview-core";
import { normalizeProperties, validateColumn } from "@jingerpie/dataview-core";
import { productProperties } from "@/modules/dataview/product-properties";

// Resolve ids from `key` up front; @jingerpie/dataview-core 0.1.0-alpha.0
// validators match on `id` only
const resolvedProductProperties = normalizeProperties(productProperties);

/**
 * Validate a board column config against product properties.
 */
export function validateProductColumn(column: ColumnConfigInput | null) {
  return validateColumn(column, resolvedProductProperties);
}
