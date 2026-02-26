"use client";

import type { Cursors, CursorValue, Limit } from "@sparkyidea/shared/types";
import {
  parseAsCursors,
  parseAsExpanded,
} from "@sparkyidea/shared/utils/parsers/pagination";
import { parseAsInteger, useQueryState } from "nuqs";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

// ============================================================================
// Constants
// ============================================================================

export const FLAT_GROUP_KEY = "__all__";

// ============================================================================
// Types
// ============================================================================

/**
 * Query options compatible with TRPC's queryOptions return type.
 * tRPC automatically provides queryFn.
 */
export interface GroupQueryOptions {
  // biome-ignore lint/suspicious/noExplicitAny: TRPC returns complex types
  queryFn?: (...args: any[]) => any;
  queryKey: readonly unknown[];
}

/**
 * Query options factory function type.
 */
export type QueryOptionsFactory<TQueryOptions extends GroupQueryOptions> = (
  groupKey: string,
  cursor?: CursorValue
) => TQueryOptions;

/**
 * Group counts from server (optional).
 */
export interface GroupCounts {
  [groupKey: string]: { count: number; hasMore: boolean };
}

/**
 * Context value for GroupPaginationProvider.
 * Provides state management - queries are handled by useGroupQuery hook.
 */
export interface GroupPaginationContextValue<
  TQueryOptions extends GroupQueryOptions = GroupQueryOptions,
> {
  cursors: Cursors;
  expandedGroups: string[];
  groupCounts?: GroupCounts;
  groupKeys: string[];
  isPending: boolean;
  limit: Limit;
  queryOptionsFactory: QueryOptionsFactory<TQueryOptions>;
  setCursor: (groupKey: string, cursor: CursorValue | null) => void;
  setExpandedGroups: (groups: string[]) => void;
  setLimit: (limit: Limit) => void;
}

// ============================================================================
// Context
// ============================================================================

const GroupPaginationContext = createContext<
  GroupPaginationContextValue | undefined
>(undefined);

export function useGroupPaginationContext<
  TQueryOptions extends GroupQueryOptions = GroupQueryOptions,
>(): GroupPaginationContextValue<TQueryOptions> {
  const context = useContext(GroupPaginationContext);
  if (!context) {
    throw new Error(
      "useGroupPaginationContext must be used within a GroupPaginationProvider"
    );
  }
  return context as GroupPaginationContextValue<TQueryOptions>;
}

// ============================================================================
// Provider Props
// ============================================================================

export interface GroupPaginationProviderProps<
  TQueryOptions extends GroupQueryOptions = GroupQueryOptions,
> {
  /** Children */
  children: ReactNode;

  /** Initial expanded groups */
  defaultExpanded?: string[];

  /** Default page limit @default 10 */
  defaultLimit?: Limit;

  /** Optional group counts from server (for count display) */
  groupCounts?: GroupCounts;

  /** All group keys in stable order */
  groupKeys: string[];

  /** Query options factory - tRPC provides queryFn automatically */
  queryOptionsFactory: QueryOptionsFactory<TQueryOptions>;
}

// ============================================================================
// Provider Component
// ============================================================================

/**
 * GroupPaginationProvider - Manages URL state for per-group pagination.
 *
 * This provider only handles state management:
 * - cursors, expanded groups, limit in URL via nuqs
 * - queryOptionsFactory for per-group queries
 *
 * Queries are handled by useGroupQuery hook in per-group components.
 * This allows unlimited groups and follows React patterns.
 *
 * @example
 * ```tsx
 * <GroupPaginationProvider
 *   groupKeys={groupKeys}
 *   queryOptionsFactory={(groupKey, cursor) => trpc.product.getMany.queryOptions({...})}
 * >
 *   <FlatTableContent />
 * </GroupPaginationProvider>
 * ```
 */
export function GroupPaginationProvider<
  TQueryOptions extends GroupQueryOptions = GroupQueryOptions,
>({
  children,
  groupKeys,
  groupCounts,
  defaultExpanded,
  defaultLimit = 10,
  queryOptionsFactory,
}: GroupPaginationProviderProps<TQueryOptions>) {
  const [isPending, startTransition] = useTransition();

  // Track if this is an internal change (user interaction) vs external (navigation)
  const isInternalChange = useRef(false);

  // URL state
  const [cursors, setCursorsState] = useQueryState(
    "cursors",
    parseAsCursors.withDefault({}).withOptions({ shallow: false })
  );
  const [urlExpanded, setUrlExpanded] = useQueryState(
    "expanded",
    parseAsExpanded.withOptions({ shallow: false })
  );
  const [urlLimit, setUrlLimit] = useQueryState(
    "limit",
    parseAsInteger.withOptions({ shallow: false })
  );

  // Compute initial expanded value
  const getInitialExpanded = useCallback(() => {
    if (urlExpanded && urlExpanded.length > 0) {
      return urlExpanded;
    }
    if (defaultExpanded && defaultExpanded.length > 0) {
      return defaultExpanded;
    }
    // Flat mode (not grouped) - always expand to show data
    if (groupKeys.length === 1 && groupKeys[0] === FLAT_GROUP_KEY) {
      return [FLAT_GROUP_KEY];
    }
    // Grouped mode - no groups expanded by default
    return [];
  }, [urlExpanded, defaultExpanded, groupKeys]);

  // Local state for immediate UI updates (sync)
  // URL state is updated async in transition for persistence
  const [localExpanded, setLocalExpanded] =
    useState<string[]>(getInitialExpanded);

  // Sync from URL when it changes externally (e.g., browser navigation)
  useEffect(() => {
    if (!isInternalChange.current) {
      setLocalExpanded(getInitialExpanded());
    }
    isInternalChange.current = false;
  }, [urlExpanded, getInitialExpanded]);

  const limit = (urlLimit ?? defaultLimit) as Limit;

  // State setters
  const setCursor = useCallback(
    (groupKey: string, cursor: CursorValue | null) => {
      startTransition(() => {
        if (cursor === null) {
          const { [groupKey]: _, ...rest } = cursors;
          setCursorsState(Object.keys(rest).length > 0 ? rest : null);
        } else {
          setCursorsState({ ...cursors, [groupKey]: cursor });
        }
      });
    },
    [cursors, setCursorsState]
  );

  const setExpandedGroups = useCallback(
    (groups: string[]) => {
      // Update local state SYNCHRONOUSLY for immediate UI response
      setLocalExpanded(groups);
      isInternalChange.current = true;

      // Update URL state ASYNCHRONOUSLY in transition
      startTransition(() => {
        const collapsedGroups = localExpanded.filter(
          (g) => !groups.includes(g)
        );
        if (collapsedGroups.length > 0) {
          const newCursors = { ...cursors };
          for (const g of collapsedGroups) {
            delete newCursors[g];
          }
          setCursorsState(
            Object.keys(newCursors).length > 0 ? newCursors : null
          );
        }
        setUrlExpanded(groups.length > 0 ? groups : null);
      });
    },
    [localExpanded, cursors, setCursorsState, setUrlExpanded]
  );

  const setLimit = useCallback(
    (newLimit: Limit) => {
      startTransition(() => {
        setUrlLimit(newLimit);
        setCursorsState(null);
      });
    },
    [setUrlLimit, setCursorsState]
  );

  // Context value - uses localExpanded for immediate UI response
  const contextValue = useMemo<GroupPaginationContextValue<TQueryOptions>>(
    () => ({
      groupKeys,
      groupCounts,
      cursors,
      expandedGroups: localExpanded,
      limit,
      setCursor,
      setExpandedGroups,
      setLimit,
      queryOptionsFactory,
      isPending,
    }),
    [
      groupKeys,
      groupCounts,
      cursors,
      localExpanded,
      limit,
      setCursor,
      setExpandedGroups,
      setLimit,
      queryOptionsFactory,
      isPending,
    ]
  );

  return (
    <GroupPaginationContext.Provider value={contextValue}>
      {children}
    </GroupPaginationContext.Provider>
  );
}
