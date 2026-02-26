"use client";

import type { Limit } from "@sparkyidea/shared/types";
import { parseAsExpanded } from "@sparkyidea/shared/utils/parsers/pagination";
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

const THROTTLE_MS = 50;

// ============================================================================
// Constants
// ============================================================================

export const FLAT_GROUP_KEY = "__all__";

// ============================================================================
// Types
// ============================================================================

/**
 * Query options compatible with TRPC's infiniteQueryOptions return type.
 */
export interface InfiniteGroupQueryOptions {
  // biome-ignore lint/suspicious/noExplicitAny: TRPC returns complex types
  getNextPageParam?: any;
  // biome-ignore lint/suspicious/noExplicitAny: TRPC returns complex types
  initialPageParam?: any;
  // biome-ignore lint/suspicious/noExplicitAny: TRPC returns complex types
  queryFn?: any;
  queryKey: readonly unknown[];
}

/**
 * Query options factory function type.
 */
export type InfiniteQueryOptionsFactory<
  TQueryOptions extends InfiniteGroupQueryOptions,
> = (groupKey: string) => TQueryOptions;

/**
 * Group counts from server (optional).
 */
export interface GroupCounts {
  [groupKey: string]: { count: number; hasMore: boolean };
}

/**
 * Context value for InfinitePaginationProvider.
 */
export interface InfinitePaginationContextValue<
  TQueryOptions extends InfiniteGroupQueryOptions = InfiniteGroupQueryOptions,
> {
  expandedGroups: string[];
  groupCounts?: GroupCounts;
  groupKeys: string[];
  isPending: boolean;
  limit: Limit;
  queryOptionsFactory: InfiniteQueryOptionsFactory<TQueryOptions>;
  setExpandedGroups: (groups: string[]) => void;
  setLimit: (limit: Limit) => void;
}

// ============================================================================
// Context
// ============================================================================

const InfinitePaginationContext = createContext<
  InfinitePaginationContextValue | undefined
>(undefined);

export function useInfinitePaginationContext<
  TQueryOptions extends InfiniteGroupQueryOptions = InfiniteGroupQueryOptions,
>(): InfinitePaginationContextValue<TQueryOptions> {
  const context = useContext(InfinitePaginationContext);
  if (!context) {
    throw new Error(
      "useInfinitePaginationContext must be used within an InfinitePaginationProvider"
    );
  }
  return context as InfinitePaginationContextValue<TQueryOptions>;
}

// ============================================================================
// Provider Props
// ============================================================================

export interface InfinitePaginationProviderProps<
  TQueryOptions extends InfiniteGroupQueryOptions = InfiniteGroupQueryOptions,
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

  /** Query options factory - receives groupKey only (no cursor for infinite) */
  queryOptionsFactory: InfiniteQueryOptionsFactory<TQueryOptions>;
}

// ============================================================================
// Provider Component
// ============================================================================

/**
 * InfinitePaginationProvider - Manages URL state for infinite pagination.
 *
 * This provider handles state management:
 * - expanded groups, limit in URL via nuqs
 * - queryOptionsFactory for per-group infinite queries
 *
 * Unlike page pagination, infinite queries don't need cursor URL state
 * because TanStack Query's useInfiniteQuery manages pages internally.
 *
 * Queries are handled by useInfiniteGroupQuery hook in per-group components.
 */
export function InfinitePaginationProvider<
  TQueryOptions extends InfiniteGroupQueryOptions = InfiniteGroupQueryOptions,
>({
  children,
  groupKeys,
  groupCounts,
  defaultExpanded,
  defaultLimit = 10,
  queryOptionsFactory,
}: InfinitePaginationProviderProps<TQueryOptions>) {
  const [isPending, startTransition] = useTransition();

  // Track if this is an internal change (user interaction) vs external (navigation)
  const isInternalChange = useRef(false);

  // URL state - using shallow: true (default) for fast client-side updates
  // React Query handles refetching via queryKey changes
  const [urlExpanded, setUrlExpanded] = useQueryState(
    "expanded",
    parseAsExpanded.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlLimit, setUrlLimit] = useQueryState(
    "limit",
    parseAsInteger.withOptions({ throttleMs: THROTTLE_MS })
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

  // Local state for immediate UI updates
  const [localExpanded, setLocalExpanded] =
    useState<string[]>(getInitialExpanded);

  // Track previous groupKeys to detect mode changes
  const prevGroupKeysRef = useRef(groupKeys);

  // Sync from URL when it changes externally
  useEffect(() => {
    if (!isInternalChange.current) {
      setLocalExpanded(getInitialExpanded());
    }
    isInternalChange.current = false;
  }, [urlExpanded, getInitialExpanded]);

  // Handle groupKeys changes (e.g., switching between flat and grouped mode)
  useEffect(() => {
    const prevKeys = prevGroupKeysRef.current;
    const keysChanged =
      prevKeys.length !== groupKeys.length ||
      prevKeys.some((k, i) => k !== groupKeys[i]);

    if (keysChanged) {
      prevGroupKeysRef.current = groupKeys;
      // Reset expanded state based on new groupKeys
      setLocalExpanded(getInitialExpanded());
    }
  }, [groupKeys, getInitialExpanded]);

  const limit = (urlLimit ?? defaultLimit) as Limit;

  // State setters
  const setExpandedGroups = useCallback(
    (groups: string[]) => {
      // Update local state SYNCHRONOUSLY for immediate UI response
      setLocalExpanded(groups);
      isInternalChange.current = true;

      // Update URL state ASYNCHRONOUSLY in transition
      startTransition(() => {
        setUrlExpanded(groups.length > 0 ? groups : null);
      });
    },
    [setUrlExpanded]
  );

  const setLimit = useCallback(
    (newLimit: Limit) => {
      startTransition(() => {
        setUrlLimit(newLimit);
      });
    },
    [setUrlLimit]
  );

  // Context value
  const contextValue = useMemo<InfinitePaginationContextValue<TQueryOptions>>(
    () => ({
      groupKeys,
      groupCounts,
      expandedGroups: localExpanded,
      limit,
      setExpandedGroups,
      setLimit,
      queryOptionsFactory,
      isPending,
    }),
    [
      groupKeys,
      groupCounts,
      localExpanded,
      limit,
      setExpandedGroups,
      setLimit,
      queryOptionsFactory,
      isPending,
    ]
  );

  return (
    <InfinitePaginationContext.Provider value={contextValue}>
      {children}
    </InfinitePaginationContext.Provider>
  );
}
