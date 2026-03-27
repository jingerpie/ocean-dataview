import {
  createDataViewParamsCache,
  type InferParamsType,
} from "@sparkyidea/dataview/parsers";
import type {
  ColumnConfigInput,
  SortQuery,
  WhereNode,
} from "@sparkyidea/dataview/types";
import {
  validateColumn,
  validateFilter,
  validateSort,
} from "@sparkyidea/dataview/validators";
import { productProperties } from "@/modules/dataview/product-properties";

// ============================================================================
// Server-side Search Params Cache
// ============================================================================

/**
 * Product search params cache with pure parsers (no validation during parse).
 * Validation happens separately in hybrid demo components using validateFilter/validateSort.
 */
export const productPaginationParams = createDataViewParamsCache();

// ============================================================================
// Re-export Validators for Demo Components
// ============================================================================

/**
 * Validate column against product properties.
 */
export function validateProductColumn(column: ColumnConfigInput | null) {
  return validateColumn(column, productProperties);
}

/**
 * Validate filter against product properties.
 */
export function validateProductFilter(filter: WhereNode[] | null) {
  return validateFilter(filter, productProperties);
}

/**
 * Validate sort against product properties.
 */
export function validateProductSort(sort: SortQuery[] | null) {
  return validateSort(sort, productProperties);
}

// ============================================================================
// Type Exports
// ============================================================================

export type ProductPaginationParams = InferParamsType<
  typeof productPaginationParams
>;
