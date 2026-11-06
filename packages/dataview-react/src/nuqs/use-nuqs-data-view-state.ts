"use client";

import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useCallback, useMemo, useRef } from "react";
import type {
  DataViewState,
  DataViewStateAdapter,
} from "../providers/data-view-state";
import {
  parseAsColumnBy,
  parseAsCursors,
  parseAsFilter,
  parseAsGroupBy,
  parseAsSort,
} from "./parsers";

const THROTTLE_MS = 50;

const parsers = {
  column: parseAsColumnBy,
  cursors: parseAsCursors,
  filter: parseAsFilter,
  group: parseAsGroupBy,
  limit: parseAsInteger,
  search: parseAsString,
  sort: parseAsSort,
};

export interface UseNuqsDataViewStateOptions {
  /**
   * Prefix for every URL parameter key (for example `"orders."` gives
   * `?orders.filter=...`). Use a distinct prefix for each view on a page,
   * and the same prefix in `createDataViewParamsCache`.
   */
  urlPrefix?: string;
}

/**
 * URL-backed view state through nuqs. Pass the result to
 * `DataViewProvider`'s `state` prop.
 */
export function useNuqsDataViewState({
  urlPrefix = "",
}: UseNuqsDataViewStateOptions = {}): DataViewStateAdapter {
  const urlKeys = useMemo(
    () => ({
      column: `${urlPrefix}column`,
      cursors: `${urlPrefix}cursors`,
      filter: `${urlPrefix}filter`,
      group: `${urlPrefix}group`,
      limit: `${urlPrefix}limit`,
      search: `${urlPrefix}search`,
      sort: `${urlPrefix}sort`,
    }),
    [urlPrefix]
  );

  const [query, setQuery] = useQueryStates(parsers, {
    throttleMs: THROTTLE_MS,
    urlKeys,
  });

  const value = useMemo<DataViewState>(
    () => ({
      column: query.column,
      cursors: query.cursors,
      filter: query.filter,
      group: query.group,
      limit: query.limit,
      search: query.search,
      sort: query.sort,
    }),
    [query]
  );

  // Latest state, including updates not yet reflected in `value`, so that
  // several updates in one event build on each other.
  const latestRef = useRef(value);
  const renderedRef = useRef(value);
  if (renderedRef.current !== value) {
    renderedRef.current = value;
    latestRef.current = value;
  }

  const onChange = useCallback(
    (update: (previous: DataViewState) => DataViewState) => {
      const previous = latestRef.current;
      const next = update(previous);
      latestRef.current = next;

      // Write only the keys that changed; nuqs skips `undefined` entries.
      const changed: Partial<Record<keyof DataViewState, unknown>> = {};
      for (const key of Object.keys(next) as (keyof DataViewState)[]) {
        if (next[key] !== previous[key]) {
          changed[key] = next[key];
        }
      }
      if (Object.keys(changed).length > 0) {
        void setQuery(changed as Parameters<typeof setQuery>[0]);
      }
    },
    [setQuery]
  );

  return useMemo(() => ({ onChange, value }), [onChange, value]);
}
