import { validateFilter, validateSort } from "@sparkyidea/dataview/validators";
import {
  createDataViewParamsCache,
  type InferParamsType,
} from "@sparkyidea/shared/search-params";
import type { SortQuery, WhereNode } from "@sparkyidea/shared/types";
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
