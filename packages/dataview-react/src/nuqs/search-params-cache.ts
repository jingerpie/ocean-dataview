import type { Limit } from "@jingerpie/dataview-core";
import { createParser, createSearchParamsCache } from "nuqs/server";
import {
  columnServerParser,
  cursorsServerParser,
  expandedServerParser,
  filterServerParser,
  groupServerParser,
  limitServerParser,
  sortServerParser,
} from "./parsers";

export interface DataViewParserOptions {
  /** Default limit value (default: 25) */
  limitDefault?: Limit;
  /** URL key prefix; must match the DataViewProvider `urlPrefix` */
  urlPrefix?: string;
}

const defaultSearchParser = createParser({
  parse: (v) => v ?? "",
  serialize: (v) => v,
}).withDefault("");

/**
 * Create a search params cache for DataView pages.
 *
 * Uses pure parsers from dataview (no validation during parse).
 * Validation is done separately using validateFilter/validateSort after parsing.
 *
 * @example
 * ```ts
 * export const paginationParams = createDataViewParamsCache();
 *
 * // In your component:
 * const { filter, sort } = paginationParams.parse(params);
 * const validatedFilter = validateFilter(filter, properties);
 * const validatedSort = validateSort(sort, properties);
 * ```
 */
export function createDataViewParamsCache(options?: DataViewParserOptions) {
  const prefix = options?.urlPrefix ?? "";
  return createSearchParamsCache(
    {
      column: columnServerParser,
      cursors: cursorsServerParser,
      expanded: expandedServerParser,
      filter: filterServerParser,
      group: groupServerParser,
      limit: limitServerParser.withDefault(options?.limitDefault ?? 25),
      search: defaultSearchParser,
      sort: sortServerParser.withDefault([]),
    },
    {
      urlKeys: {
        column: `${prefix}column`,
        cursors: `${prefix}cursors`,
        expanded: `${prefix}expanded`,
        filter: `${prefix}filter`,
        group: `${prefix}group`,
        limit: `${prefix}limit`,
        search: `${prefix}search`,
        sort: `${prefix}sort`,
      },
    }
  );
}

/**
 * Type helper to extract parsed params type from a cache.
 */
export type InferParamsType<
  T extends { parse: (...args: never[]) => unknown },
> = Awaited<ReturnType<T["parse"]>>;
