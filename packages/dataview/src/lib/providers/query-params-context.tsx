// biome-ignore-all lint/complexity/noVoid: void used to discard nuqs setter promises in startTransition
"use client";

import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useTransition,
} from "react";
import { parseAsColumnBy } from "../../parsers/column";
import { parseAsFilter } from "../../parsers/filter";
import { parseAsGroupBy } from "../../parsers/group";
import { parseAsCursors } from "../../parsers/pagination";
import { parseAsSort } from "../../parsers/sort";
import type { SortQuery, WhereNode } from "../../types/filter.type";
import type {
  ColumnConfigInput,
  GroupConfigInput,
} from "../../types/group.type";
import type { Limit } from "../../types/pagination";
import type { Cursors, CursorValue } from "../../types/pagination-types";
import type { DataViewProperty, PropertyMeta } from "../../types/property.type";
import { validate } from "../../validators";

const THROTTLE_MS = 50;

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
  /** Search query */
  search: string;
  /** Validated sort */
  sort: SortQuery[];
}

/**
 * Setters for query params.
 * All setters write to URL and are wrapped in transitions.
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
  /** Default values when URL params are missing */
  defaults?: QueryParamsDefaults;
  /** Property schema for validation */
  properties: readonly DataViewProperty<unknown>[] | readonly PropertyMeta[];
}

/**
 * QueryParamsProvider - Single source of truth for URL-backed query state.
 *
 * Reads URL state once, validates against properties, and provides
 * canonical values to all consumers (toolbar and content).
 *
 * @example
 * ```tsx
 * <QueryParamsProvider properties={productProperties} defaults={{ limit: 25 }}>
 *   <Toolbar />
 *   <Suspense>
 *     <Content />
 *   </Suspense>
 * </QueryParamsProvider>
 * ```
 */
export function QueryParamsProvider({
  children,
  defaults,
  properties,
}: QueryParamsProviderProps) {
  const {
    column: defaultColumn = null,
    filter: defaultFilter = null,
    group: defaultGroup = null,
    limit: defaultLimit = 25,
    search: defaultSearch = "",
    sort: defaultSort = [],
  } = defaults ?? {};

  const [isPending, startTransition] = useTransition();

  // ============================================================================
  // URL State (read once)
  // ============================================================================

  const [urlColumn, setUrlColumn] = useQueryState(
    "column",
    parseAsColumnBy.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlCursors, setUrlCursors] = useQueryState(
    "cursors",
    parseAsCursors.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlFilter, setUrlFilter] = useQueryState(
    "filter",
    parseAsFilter.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlGroup, setUrlGroup] = useQueryState(
    "group",
    parseAsGroupBy.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlLimit, setUrlLimit] = useQueryState(
    "limit",
    parseAsInteger.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlSearch, setUrlSearch] = useQueryState(
    "search",
    parseAsString.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlSort, setUrlSort] = useQueryState(
    "sort",
    parseAsSort.withOptions({ throttleMs: THROTTLE_MS })
  );

  // ============================================================================
  // Merge with defaults
  // ============================================================================

  const rawColumn = (urlColumn ?? defaultColumn) as ColumnConfigInput | null;
  const rawFilter = (urlFilter ?? defaultFilter) as WhereNode[] | null;
  const rawGroup = (urlGroup ?? defaultGroup) as GroupConfigInput | null;
  const rawSort = (urlSort ?? defaultSort) as SortQuery[];
  const search = urlSearch ?? defaultSearch;

  // ============================================================================
  // Validate and build state
  // ============================================================================

  const state = useMemo<QueryParamsState>(() => {
    const { column, cursors, filter, group, limit, sort } = validate(
      {
        column: rawColumn,
        cursors: urlCursors,
        filter: rawFilter,
        group: rawGroup,
        limit: urlLimit,
        sort: rawSort,
      },
      properties,
      defaultLimit
    );
    return { column, cursors, filter, group, isPending, limit, search, sort };
  }, [
    rawColumn,
    urlCursors,
    rawFilter,
    rawGroup,
    urlLimit,
    rawSort,
    properties,
    defaultLimit,
    isPending,
    search,
  ]);

  // ============================================================================
  // Setters (stable references)
  // ============================================================================

  const setColumn = useCallback(
    (newColumn: ColumnConfigInput | null) => {
      startTransition(() => {
        void setUrlColumn(newColumn);
      });
    },
    [setUrlColumn]
  );

  const setCursor = useCallback(
    (groupKey: string, cursor: CursorValue | null) => {
      startTransition(() => {
        if (cursor === null) {
          void setUrlCursors((prev) => {
            if (!prev) {
              return null;
            }
            const next = { ...prev };
            delete next[groupKey];
            return Object.keys(next).length > 0 ? next : null;
          });
        } else {
          void setUrlCursors((prev) => ({ ...prev, [groupKey]: cursor }));
        }
      });
    },
    [setUrlCursors]
  );

  const clearCursors = useCallback(() => {
    startTransition(() => {
      void setUrlCursors(null);
    });
  }, [setUrlCursors]);

  // Setters clear cursors to reset pagination on query changes
  const setFilter = useCallback(
    (newFilter: WhereNode[] | null) => {
      startTransition(() => {
        void setUrlFilter(newFilter);
        void setUrlCursors(null);
      });
    },
    [setUrlFilter, setUrlCursors]
  );

  const setGroup = useCallback(
    (newGroup: GroupConfigInput | null) => {
      startTransition(() => {
        void setUrlGroup(newGroup);
        void setUrlCursors(null);
      });
    },
    [setUrlGroup, setUrlCursors]
  );

  const setLimit = useCallback(
    (newLimit: Limit) => {
      startTransition(() => {
        void setUrlLimit(newLimit);
        void setUrlCursors(null);
      });
    },
    [setUrlLimit, setUrlCursors]
  );

  const setSearch = useCallback(
    (newSearch: string) => {
      startTransition(() => {
        void setUrlSearch(newSearch || null);
        void setUrlCursors(null);
      });
    },
    [setUrlSearch, setUrlCursors]
  );

  const setSort = useCallback(
    (newSort: SortQuery[]) => {
      startTransition(() => {
        void setUrlSort(newSort.length > 0 ? newSort : null);
        void setUrlCursors(null);
      });
    },
    [setUrlSort, setUrlCursors]
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

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <QueryParamsStateContext.Provider value={state}>
      <QueryParamsActionsContext.Provider value={actions}>
        {children}
      </QueryParamsActionsContext.Provider>
    </QueryParamsStateContext.Provider>
  );
}
