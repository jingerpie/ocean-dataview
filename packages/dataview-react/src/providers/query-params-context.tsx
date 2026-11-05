"use client";

import type {
  ColumnConfigInput,
  Cursors,
  CursorValue,
  DataViewProperty,
  GroupConfigInput,
  Limit,
  PropertyMeta,
  SearchQuery,
  SortQuery,
  WhereNode,
} from "@sparkyidea/dataview-core";
import { validate } from "@sparkyidea/dataview-core";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useTransition,
} from "react";
import {
  type DataViewState,
  type DataViewStateAdapter,
  useLocalDataViewState,
} from "./data-view-state";

// ============================================================================
// Types
// ============================================================================

/**
 * Validated query params state.
 * All values are validated against properties.
 */
export interface QueryParamsState {
  /** Validated column config (board-specific) */
  column: ColumnConfigInput | null;
  /** Cursor positions for page-based pagination */
  cursors: Cursors;
  /** Validated filter */
  filter: WhereNode[] | null;
  /** Validated group config */
  group: GroupConfigInput | null;
  /** Whether a transition is pending */
  isPending: boolean;
  /** Page size limit */
  limit: Limit;
  /** Validated search */
  search: SearchQuery | null;
  /** Validated sort */
  sort: SortQuery[];
}

/**
 * Setters for query params.
 * All setters write to the state adapter and are wrapped in transitions.
 */
export interface QueryParamsActions {
  /** Clear all cursors */
  clearCursors: () => void;
  /** Set column config */
  setColumn: (column: ColumnConfigInput | null) => void;
  /** Set cursor for a specific group */
  setCursor: (groupKey: string, cursor: CursorValue | null) => void;
  /** Set filter */
  setFilter: (filter: WhereNode[] | null) => void;
  /** Set group config */
  setGroup: (group: GroupConfigInput | null) => void;
  /** Set limit */
  setLimit: (limit: Limit) => void;
  /** Set search */
  setSearch: (search: string) => void;
  /** Set sort */
  setSort: (sort: SortQuery[]) => void;
}

/**
 * Defaults configuration for query params.
 */
export interface QueryParamsDefaults {
  column?: ColumnConfigInput | null;
  filter?: WhereNode[] | null;
  group?: GroupConfigInput | null;
  limit?: Limit;
  search?: string;
  sort?: SortQuery[];
}

// ============================================================================
// Contexts (split for performance)
// ============================================================================

/**
 * Context for query params state (values).
 * Components that only read values subscribe here.
 */
const QueryParamsStateContext = createContext<QueryParamsState | undefined>(
  undefined
);

/**
 * Context for query params actions (setters).
 * Components that only need setters subscribe here (stable references).
 */
const QueryParamsActionsContext = createContext<QueryParamsActions | undefined>(
  undefined
);

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access query params state.
 * Throws if used outside QueryParamsProvider.
 */
export function useQueryParamsState(): QueryParamsState {
  const context = useContext(QueryParamsStateContext);
  if (!context) {
    throw new Error(
      "useQueryParamsState must be used within QueryParamsProvider"
    );
  }
  return context;
}

/**
 * Hook to access query params actions (setters).
 * Throws if used outside QueryParamsProvider.
 */
export function useQueryParamsActions(): QueryParamsActions {
  const context = useContext(QueryParamsActionsContext);
  if (!context) {
    throw new Error(
      "useQueryParamsActions must be used within QueryParamsProvider"
    );
  }
  return context;
}

/**
 * Hook to access both state and actions.
 * Convenience hook - prefer useQueryParamsState or useQueryParamsActions
 * for better performance when you only need one.
 */
export function useQueryParamsContext(): QueryParamsState & QueryParamsActions {
  const state = useQueryParamsState();
  const actions = useQueryParamsActions();
  return { ...state, ...actions };
}

// ============================================================================
// Provider
// ============================================================================

interface QueryParamsProviderProps {
  children: ReactNode;
  /** Default values when the state has no value set */
  defaults?: QueryParamsDefaults;
  /** Property schema for validation */
  properties: readonly DataViewProperty<unknown>[] | readonly PropertyMeta[];
  /** State store. Defaults to in-memory state */
  state?: DataViewStateAdapter;
}

/**
 * QueryParamsProvider - Single source of truth for view query state.
 *
 * Reads raw state from the adapter, validates it against properties, and
 * provides canonical values to all consumers (toolbar and content).
 */
export function QueryParamsProvider({
  children,
  defaults,
  properties,
  state: stateProp,
}: QueryParamsProviderProps) {
  const {
    column: defaultColumn = null,
    filter: defaultFilter = null,
    group: defaultGroup = null,
    limit: defaultLimit = 25,
    search: defaultSearch = "",
    sort: defaultSort = [],
  } = defaults ?? {};

  const [isTransitionPending, startTransition] = useTransition();
  const localState = useLocalDataViewState();
  const adapter = stateProp ?? localState;
  const { onChange, value: raw } = adapter;
  const isPending = isTransitionPending || (adapter.isPending ?? false);

  // ============================================================================
  // Merge with defaults, validate
  // ============================================================================

  const rawColumn = raw.column ?? defaultColumn;
  const rawFilter = raw.filter ?? defaultFilter;
  const rawGroup = raw.group ?? defaultGroup;
  const rawSort = raw.sort ?? defaultSort;
  const rawSearch = raw.search ?? defaultSearch;

  const state = useMemo<QueryParamsState>(() => {
    const { column, cursors, filter, group, limit, search, sort } = validate(
      {
        column: rawColumn,
        cursors: raw.cursors,
        filter: rawFilter,
        group: rawGroup,
        limit: raw.limit,
        search: rawSearch,
        sort: rawSort,
      },
      properties,
      defaultLimit
    );
    return { column, cursors, filter, group, isPending, limit, search, sort };
  }, [
    rawColumn,
    raw.cursors,
    rawFilter,
    rawGroup,
    raw.limit,
    rawSort,
    properties,
    defaultLimit,
    isPending,
    rawSearch,
  ]);

  // ============================================================================
  // Setters (stable references)
  // ============================================================================

  /** Apply a partial update inside a transition. */
  const update = useCallback(
    (patch: (previous: DataViewState) => Partial<DataViewState>) => {
      startTransition(() => {
        onChange((previous) => ({ ...previous, ...patch(previous) }));
      });
    },
    [onChange]
  );

  const setColumn = useCallback(
    (column: ColumnConfigInput | null) => update(() => ({ column })),
    [update]
  );

  const setCursor = useCallback(
    (groupKey: string, cursor: CursorValue | null) =>
      update((previous) => {
        const next: Cursors = { ...previous.cursors };
        if (cursor === null) {
          delete next[groupKey];
        } else {
          next[groupKey] = cursor;
        }
        return { cursors: Object.keys(next).length > 0 ? next : null };
      }),
    [update]
  );

  const clearCursors = useCallback(
    () => update(() => ({ cursors: null })),
    [update]
  );

  // Setters below clear cursors to reset pagination on query changes.
  // When a default exists and the user clears the value, write an explicit
  // empty array: null means "not set" and falls back to the default.
  const setFilter = useCallback(
    (filter: WhereNode[] | null) => {
      let value: WhereNode[] | null = null;
      if (filter && filter.length > 0) {
        value = filter;
      } else if (defaultFilter) {
        value = [];
      }
      update(() => ({ cursors: null, filter: value }));
    },
    [update, defaultFilter]
  );

  const setGroup = useCallback(
    (group: GroupConfigInput | null) =>
      update(() => ({ cursors: null, group })),
    [update]
  );

  const setLimit = useCallback(
    (limit: Limit) => update(() => ({ cursors: null, limit })),
    [update]
  );

  const setSearch = useCallback(
    (search: string) =>
      update(() => ({ cursors: null, search: search || null })),
    [update]
  );

  const setSort = useCallback(
    (sort: SortQuery[]) => {
      let value: SortQuery[] | null = null;
      if (sort.length > 0) {
        value = sort;
      } else if (defaultSort.length > 0) {
        value = [];
      }
      update(() => ({ cursors: null, sort: value }));
    },
    [update, defaultSort]
  );

  // ============================================================================
  // Actions value (memoized with stable callbacks)
  // ============================================================================

  const actions = useMemo<QueryParamsActions>(
    () => ({
      clearCursors,
      setColumn,
      setCursor,
      setFilter,
      setGroup,
      setLimit,
      setSearch,
      setSort,
    }),
    [
      clearCursors,
      setColumn,
      setCursor,
      setFilter,
      setGroup,
      setLimit,
      setSearch,
      setSort,
    ]
  );

  return (
    <QueryParamsStateContext.Provider value={state}>
      <QueryParamsActionsContext.Provider value={actions}>
        {children}
      </QueryParamsActionsContext.Provider>
    </QueryParamsStateContext.Provider>
  );
}
