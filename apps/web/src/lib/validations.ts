import { createFilterParser } from "@sparkyidea/shared/utils/parsers/filter";
import { groupServerParser } from "@sparkyidea/shared/utils/parsers/group";
import {
  cursorsServerParser,
  expandedServerParser,
  limitServerParser,
} from "@sparkyidea/shared/utils/parsers/pagination";
import { sortServerParser } from "@sparkyidea/shared/utils/parsers/sort";
import { createParser, createSearchParamsCache } from "nuqs/server";
import { productProperties } from "@/properties/product-properties";

// Search parser for server-side parsing
const parseAsSearch = createParser({
  parse: (v) => v ?? "",
  serialize: (v) => v,
}).withDefault("");

// ============================================================================
// Product Column Validation
// ============================================================================

/**
 * Valid filterable column IDs for products.
 * Excludes formula and button types which aren't filterable.
 */
const productFilterableColumns = new Set(
  productProperties
    .filter((p) => p.type !== "formula" && p.type !== "button")
    .map((p) => p.id)
);

/**
 * Filter parser with product column validation.
 * Rejects filters with unknown column names.
 */
export const productFilterParser = createFilterParser(productFilterableColumns);

// ============================================================================
// Server-side Search Params Cache
// ============================================================================

const sharedParsers = {
  cursors: cursorsServerParser,
  filter: productFilterParser,
  sort: sortServerParser,
  search: parseAsSearch,
  limit: limitServerParser.withDefault(25),
  group: groupServerParser,
  subGroup: groupServerParser,
};

/**
 * Product search params cache for flat pagination.
 * Uses unified `cursors` format (flat mode uses "__ungrouped__" internally).
 */
export const productPaginationParams = createSearchParamsCache({
  ...sharedParsers,
});

/**
 * Product search params cache for grouped pagination.
 * Includes expanded state for group collapsing.
 */
export const productGroupPaginationParams = createSearchParamsCache({
  expanded: expandedServerParser,
  ...sharedParsers,
});

// ============================================================================
// Type Exports
// ============================================================================

export type ProductPaginationParams = Awaited<
  ReturnType<typeof productPaginationParams.parse>
>;

export type ProductGroupPaginationParams = Awaited<
  ReturnType<typeof productGroupPaginationParams.parse>
>;
