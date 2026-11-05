"use client";

import type {
  ColumnConfigInput,
  Cursors,
  GroupConfigInput,
  SortQuery,
  WhereNode,
} from "@jingerpie/dataview-core";
import { useCallback, useMemo, useState } from "react";

/**
 * Raw, unvalidated view state. `null` means "not set": the provider falls
 * back to its defaults. An empty array means "explicitly cleared".
 */
export interface DataViewState {
  column: ColumnConfigInput | null;
  cursors: Cursors | null;
  filter: WhereNode[] | null;
  group: GroupConfigInput | null;
  limit: number | null;
  search: string | null;
  sort: SortQuery[] | null;
}

/**
 * Where a DataViewProvider stores its state. Use `useNuqsDataViewState`
 * (from `/nuqs`) for URL state, or supply your own for controlled state.
 */
export interface DataViewStateAdapter {
  /** True while the store applies an update (for example a URL write) */
  isPending?: boolean;
  onChange: (update: (previous: DataViewState) => DataViewState) => void;
  value: DataViewState;
}

export const EMPTY_DATA_VIEW_STATE: DataViewState = {
  column: null,
  cursors: null,
  filter: null,
  group: null,
  limit: null,
  search: null,
  sort: null,
};

/**
 * In-memory view state. Used when DataViewProvider gets no `state` prop.
 */
export function useLocalDataViewState(
  initial: DataViewState = EMPTY_DATA_VIEW_STATE
): DataViewStateAdapter {
  const [value, setValue] = useState(initial);
  const onChange = useCallback(
    (update: (previous: DataViewState) => DataViewState) => setValue(update),
    []
  );
  return useMemo(() => ({ onChange, value }), [onChange, value]);
}
