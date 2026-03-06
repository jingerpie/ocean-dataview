"use client";

import type { Limit, SortQuery, WhereNode } from "@sparkyidea/shared/types";
import {
  type ColumnConfigInput,
  parseAsColumnBy,
} from "@sparkyidea/shared/utils/parsers/column";
import { parseAsFilter } from "@sparkyidea/shared/utils/parsers/filter";
import {
  type GroupConfigInput,
  parseAsGroupBy,
} from "@sparkyidea/shared/utils/parsers/group";
import { parseAsCursors } from "@sparkyidea/shared/utils/parsers/pagination";
import { parseAsSort } from "@sparkyidea/shared/utils/parsers/sort";
import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
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
import type { ColumnConfig, GroupConfig } from "../../types/group-types";
import type {
  InfinitePaginationController,
  PagePaginationController,
} from "../../types/pagination-controller";
import type {
  Cursors,
  CursorValue,
  GroupCounts,
  ViewCounts,
} from "../../types/pagination-types";
import type { DataViewProperty } from "../../types/property.type";
import {
  DataViewProvider as DataViewProviderCore,
  type DataViewProviderProps,
} from "./data-view-provider";
import { useToolbarContext } from "./toolbar-context";

const THROTTLE_MS = 50;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract only the structural parts of a group config (without sort/hideEmpty).
 * This determines which groups exist - display options don't affect the group list.
 */
function getGroupByConfig(
  group: GroupConfigInput | null
): GroupConfigInput | null {
  if (!group) {
    return null;
  }

  // Extract only the byXxx config, excluding sort and hideEmpty
  if ("bySelect" in group) {
    return { bySelect: group.bySelect };
  }
  if ("byStatus" in group) {
    return { byStatus: group.byStatus };
  }
  if ("byCheckbox" in group) {
    return { byCheckbox: group.byCheckbox };
  }
  if ("byDate" in group) {
    return { byDate: group.byDate };
  }
  if ("byMultiSelect" in group) {
    return { byMultiSelect: group.byMultiSelect };
  }
  if ("byText" in group) {
    return { byText: group.byText };
  }
  if ("byNumber" in group) {
    return { byNumber: group.byNumber };
  }

  return group;
}

// ============================================================================
// Page Pagination Types
// ============================================================================

/**
 * Per-group pagination info for DataViewProvider.
 */
export interface PageGroupInfo<TData> {
  count?: number;
  displayCount?: string;
  displayEnd: number;
  displayStart: number;
  hasNext: boolean;
  hasPrev: boolean;
  isFetching: boolean;
  items: TData[];
  key: string;
  onNext: () => void;
  onPrev: () => void;
}

/**
 * Pagination state for DataViewProvider.
 */
export interface PagePaginationState<TData> {
  groups: PageGroupInfo<TData>[];
  limit: Limit;
  onLimitChange: (limit: Limit) => void;
}

// ============================================================================
// Infinite Pagination Types
// ============================================================================

/**
 * Per-group pagination info for infinite pagination.
 */
export interface InfiniteGroupInfo<TData> {
  count?: number;
  displayCount?: string;
  error: Error | null;
  hasNext: boolean | Record<string, boolean>;
  isError: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  items: TData[];
  key: string;
  onNext: () => void;
  totalLoaded: number;
}

/**
 * Pagination state for infinite pagination.
 */
export interface InfinitePaginationState<TData> {
  groups: InfiniteGroupInfo<TData>[];
  limit: Limit;
  onLimitChange: (limit: Limit) => void;
}

// ============================================================================
// Context for Query Hooks
// ============================================================================

/**
 * Runtime state provided to query hooks via context.
 * Contains current values (from URL ?? defaults) and setters.
 */
export interface QueryRuntimeState {
  // Current values (URL ?? defaults)
  cursors: Cursors;
  expandedGroups: string[];
  filter: WhereNode[] | null;
  group: GroupConfigInput | null;
  groupCounts?: Record<string, { count?: number; hasMore?: boolean }>;
  groupKeys: string[];
  groupSortValues?: Record<string, string | number>;

  // Group pagination state
  hasNextGroupPage: boolean;
  isFetchingNextGroupPage: boolean;

  // Meta
  isPending: boolean;
  limit: Limit;
  onLoadMoreGroups: () => void;
  queryOptionsFactory: (params: unknown) => unknown;
  search: string;

  // Setters
  setCursor: (groupKey: string, cursor: CursorValue | null) => void;
  setExpandedGroups: (groups: string[]) => void;
  setFilter: (filter: WhereNode[] | null) => void;
  setGroup: (group: GroupConfigInput | null) => void;
  setLimit: (limit: Limit) => void;
  setSearch: (search: string) => void;
  setSort: (sort: SortQuery[]) => void;
  sort: SortQuery[];

  type: "page" | "infinite";
}

/**
 * Context for query hooks (useGroupQuery, useInfiniteGroupQuery).
 */
export const QueryControllerContext = createContext<
  QueryRuntimeState | undefined
>(undefined);

/**
 * Hook to access the runtime state from query hooks.
 */
export function useQueryControllerContext(): QueryRuntimeState {
  const context = useContext(QueryControllerContext);
  if (!context) {
    throw new Error(
      "useQueryControllerContext must be used within a QueryBridge"
    );
  }
  return context;
}

// ============================================================================
// Infinite Group Keys Provider
// ============================================================================

/**
 * Type for paginated group query response.
 */
interface GroupQueryResponse {
  counts?: Record<string, { count: number; hasMore: boolean }>;
  hasNextPage?: boolean;
  nextCursor?: string | null;
  sortValues?: Record<string, string | number>;
}

interface InfiniteGroupKeysProps {
  children: (data: {
    groupCounts: GroupQueryResponse["counts"];
    groupKeys: string[];
    groupSortValues: GroupQueryResponse["sortValues"];
    hasNextGroupPage: boolean;
    isFetchingNextGroupPage: boolean;
    onLoadMoreGroups: () => void;
  }) => ReactNode;
  groupByConfig: GroupConfigInput;
  // Accept any function that returns infinite query options (tRPC or manual)
  // biome-ignore lint/suspicious/noExplicitAny: Must accept tRPC's infiniteQueryOptions return type
  groupQueryOptionsFactory: (groupConfig: GroupConfigInput) => any;
}

/**
 * Suspending component that fetches group keys using useSuspenseInfiniteQuery.
 * This ensures the parent suspends until group keys are available,
 * preventing the "flat view flash" when loading grouped views.
 * Supports infinite pagination for loading more groups.
 */
function InfiniteGroupKeys({
  children,
  groupByConfig,
  groupQueryOptionsFactory,
}: InfiniteGroupKeysProps) {
  const factoryOptions = groupQueryOptionsFactory(groupByConfig);

  // Spread tRPC options directly - tRPC's infiniteQueryOptions returns a complete config
  // We only provide fallbacks for getNextPageParam and initialPageParam if not present
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery({
      ...factoryOptions,
      getNextPageParam:
        factoryOptions.getNextPageParam ??
        ((lastPage: GroupQueryResponse) => lastPage.nextCursor ?? null),
      initialPageParam: factoryOptions.initialPageParam ?? null,
    });

  // Merge all pages into single counts/sortValues
  const merged = useMemo(() => {
    const counts: Record<string, { count: number; hasMore: boolean }> = {};
    const sortValues: Record<string, string | number> = {};

    for (const page of data.pages) {
      Object.assign(counts, page.counts);
      Object.assign(sortValues, page.sortValues);
    }

    return { counts, sortValues };
  }, [data.pages]);

  const groupKeys = Object.keys(merged.counts);

  const onLoadMoreGroups = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      {children({
        groupKeys,
        groupCounts: merged.counts,
        groupSortValues: merged.sortValues,
        hasNextGroupPage: hasNextPage ?? false,
        isFetchingNextGroupPage: isFetchingNextPage,
        onLoadMoreGroups,
      })}
    </>
  );
}

// ============================================================================
// Suspending Column Keys Provider (Board-specific)
// ============================================================================

interface SuspendingColumnKeysProps {
  children: (data: {
    columnCounts: GroupQueryResponse["counts"];
    columnKeys: string[];
    columnSortValues: GroupQueryResponse["sortValues"];
  }) => ReactNode;
  columnByConfig: GroupConfigInput;
  columnQueryOptionsFactory: (columnConfig: GroupConfigInput) => {
    queryFn?: unknown;
    queryKey: readonly unknown[];
  };
}

/**
 * Suspending component that fetches column keys using useSuspenseQuery.
 * Board-specific: ensures columns are available before rendering board structure.
 */
function SuspendingColumnKeys({
  children,
  columnByConfig,
  columnQueryOptionsFactory,
}: SuspendingColumnKeysProps) {
  const factoryOptions = columnQueryOptionsFactory(columnByConfig);
  const { data: rawColumnData } = useSuspenseQuery({
    queryKey: factoryOptions.queryKey,
    queryFn: factoryOptions.queryFn as () => Promise<GroupQueryResponse>,
  });

  const columnData = rawColumnData as GroupQueryResponse | null | undefined;
  const columnKeys = Object.keys(columnData?.counts ?? {});
  const columnCounts = columnData?.counts;
  const columnSortValues = columnData?.sortValues;

  return <>{children({ columnKeys, columnCounts, columnSortValues })}</>;
}

// ============================================================================
// Page Query Bridge
// ============================================================================

// Typed noop for setCursor (infinite pagination doesn't use cursors)
const noopSetCursor = (_groupKey: string, _cursor: CursorValue | null) => {
  /* no-op */
};

/**
 * URL defaults configuration.
 */
interface DefaultsConfig {
  column?: ColumnConfig | null;
  expanded?: string[];
  filter?: WhereNode[] | null;
  group?: GroupConfig | null;
  limit?: Limit;
  search?: string;
  sort?: SortQuery[];
}

interface PageQueryBridgeProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
  TQueryOptions,
> {
  children: ReactNode;
  controller: PagePaginationController<TQueryOptions>;
  defaults?: DefaultsConfig;
  viewProps: Omit<
    DataViewProviderProps<TData, TProperties>,
    | "children"
    | "counts"
    | "data"
    | "defaults"
    | "expandedGroups"
    | "filter"
    | "onExpandedGroupsChange"
    | "pagination"
    | "search"
    | "sort"
  > & {
    columnCounts?: GroupCounts;
    counts?: Partial<ViewCounts>;
  };
}

/**
 * PageQueryBridge - Orchestrates page-based query execution and data aggregation.
 *
 * Owns nuqs hooks for URL state management internally, keeping re-renders
 * scoped to this component and its children only.
 *
 * For grouped mode, uses SuspendingGroupKeys to suspend until group keys are available,
 * preventing the "flat view flash" during initial load.
 */
export function PageQueryBridge<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
  TQueryOptions,
>({
  children,
  controller,
  defaults,
  viewProps,
}: PageQueryBridgeProps<TData, TProperties, TQueryOptions>) {
  const { groupQueryOptionsFactory, queryOptionsFactory } = controller;

  // Defaults from provider props
  const {
    column: defaultColumn = null,
    expanded: defaultExpanded,
    filter: defaultFilter = null,
    group: defaultGroup = null,
    limit: defaultLimit = 25,
    search: defaultSearch = "",
    sort: defaultSort = [],
  } = defaults ?? {};

  const [isPending, startTransition] = useTransition();

  // ============================================================================
  // URL State via nuqs
  // ============================================================================

  const [urlColumn, setUrlColumn] = useQueryState(
    "column",
    parseAsColumnBy.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlCursors, setUrlCursors] = useQueryState(
    "cursors",
    parseAsCursors.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlLimit, setUrlLimit] = useQueryState(
    "limit",
    parseAsInteger.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlFilter, setUrlFilter] = useQueryState(
    "filter",
    parseAsFilter.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlSort, setUrlSort] = useQueryState(
    "sort",
    parseAsSort.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlSearch, setUrlSearch] = useQueryState(
    "search",
    parseAsString.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlGroup, setUrlGroup] = useQueryState(
    "group",
    parseAsGroupBy.withOptions({ throttleMs: THROTTLE_MS })
  );

  // ============================================================================
  // Current Values (URL ?? defaults)
  // ============================================================================

  const column = urlColumn ?? defaultColumn;
  const cursors = urlCursors ?? {};
  const filter = urlFilter ?? defaultFilter;
  const sort = urlSort ?? defaultSort;
  const search = urlSearch ?? defaultSearch;
  const group = urlGroup ?? defaultGroup;
  const limit = (urlLimit ?? defaultLimit) as Limit;

  // ============================================================================
  // Group Mode Detection
  // ============================================================================

  // For accordion grouping: use `group` config (NOT column)
  // - `column` is board-specific visual organization (handled via columnCounts prop)
  // - `group` is accordion-style data grouping (handled via groupQueryOptionsFactory)
  // Only grouped mode if we have BOTH a group config AND a factory to fetch group keys
  const isGrouped = Boolean(group && groupQueryOptionsFactory);

  // Extract only structural config (without sort/hideEmpty) for query
  const groupByConfig = useMemo(() => getGroupByConfig(group), [group]);

  // ============================================================================
  // Setters (defined before use in inner component)
  // ============================================================================

  const setColumn = useCallback(
    (newColumn: ColumnConfigInput | null) => {
      startTransition(() => {
        setUrlColumn(newColumn);
      });
    },
    [setUrlColumn]
  );

  const setCursor = useCallback(
    (groupKey: string, cursor: CursorValue | null) => {
      startTransition(() => {
        if (cursor === null) {
          // Remove cursor for this group
          setUrlCursors((prev) => {
            if (!prev) {
              return null;
            }
            const next = { ...prev };
            delete next[groupKey];
            return Object.keys(next).length > 0 ? next : null;
          });
        } else {
          setUrlCursors((prev) => ({ ...prev, [groupKey]: cursor }));
        }
      });
    },
    [setUrlCursors]
  );

  const setLimit = useCallback(
    (newLimit: Limit) => {
      startTransition(() => {
        setUrlLimit(newLimit);
        // Clear cursors when limit changes
        setUrlCursors(null);
      });
    },
    [setUrlLimit, setUrlCursors]
  );

  const setFilter = useCallback(
    (newFilter: WhereNode[] | null) => {
      startTransition(() => {
        setUrlFilter(newFilter);
        // Clear cursors when filter changes
        setUrlCursors(null);
      });
    },
    [setUrlFilter, setUrlCursors]
  );

  const setSort = useCallback(
    (newSort: SortQuery[]) => {
      startTransition(() => {
        setUrlSort(newSort.length > 0 ? newSort : null);
        // Clear cursors when sort changes
        setUrlCursors(null);
      });
    },
    [setUrlSort, setUrlCursors]
  );

  const setSearch = useCallback(
    (newSearch: string) => {
      startTransition(() => {
        setUrlSearch(newSearch || null);
        // Clear cursors when search changes
        setUrlCursors(null);
      });
    },
    [setUrlSearch, setUrlCursors]
  );

  const setGroup = useCallback(
    (newGroup: GroupConfigInput | null) => {
      startTransition(() => {
        setUrlGroup(newGroup);
        setUrlCursors(null);
      });
    },
    [setUrlGroup, setUrlCursors]
  );

  // ============================================================================
  // Render Inner Component with Group Data
  // ============================================================================

  // Noop for flat mode (no group pagination)
  const noopLoadMoreGroups = useCallback(() => {
    /* no-op */
  }, []);

  // Inner component that receives group data as props
  const renderInner = useCallback(
    ({
      groupCounts,
      groupKeys,
      groupSortValues,
      hasNextGroupPage,
      isFetchingNextGroupPage,
      onLoadMoreGroups,
    }: {
      groupCounts: GroupQueryResponse["counts"];
      groupKeys: string[];
      groupSortValues: GroupQueryResponse["sortValues"];
      hasNextGroupPage: boolean;
      isFetchingNextGroupPage: boolean;
      onLoadMoreGroups: () => void;
    }) => (
      <PageQueryBridgeInner<TData, TProperties>
        column={column}
        columnCounts={viewProps.columnCounts}
        cursors={cursors}
        defaultExpanded={defaultExpanded}
        filter={filter}
        group={group}
        groupCounts={groupCounts}
        groupKeys={groupKeys}
        groupSortValues={groupSortValues}
        hasNextGroupPage={hasNextGroupPage}
        isFetchingNextGroupPage={isFetchingNextGroupPage}
        isPending={isPending}
        limit={limit}
        onLoadMoreGroups={onLoadMoreGroups}
        queryOptionsFactory={
          queryOptionsFactory as (params: unknown) => unknown
        }
        search={search}
        setColumn={setColumn}
        setCursor={setCursor}
        setFilter={setFilter}
        setGroup={setGroup}
        setLimit={setLimit}
        setSearch={setSearch}
        setSort={setSort}
        sort={sort}
        viewProps={viewProps}
      >
        {children}
      </PageQueryBridgeInner>
    ),
    [
      children,
      column,
      cursors,
      defaultExpanded,
      filter,
      group,
      isPending,
      limit,
      queryOptionsFactory,
      search,
      setColumn,
      setCursor,
      setFilter,
      setGroup,
      setLimit,
      setSearch,
      setSort,
      sort,
      viewProps,
    ]
  );

  // ============================================================================
  // Flat vs Grouped Mode Branching
  // ============================================================================

  // FLAT MODE: Render directly with static groupKeys
  if (!(isGrouped && groupByConfig && groupQueryOptionsFactory)) {
    return renderInner({
      groupCounts: undefined,
      groupKeys: ["__ungrouped__"],
      groupSortValues: undefined,
      hasNextGroupPage: false,
      isFetchingNextGroupPage: false,
      onLoadMoreGroups: noopLoadMoreGroups,
    });
  }

  // GROUPED MODE: Use InfiniteGroupKeys to suspend until group data is ready
  return (
    <InfiniteGroupKeys
      groupByConfig={groupByConfig}
      groupQueryOptionsFactory={groupQueryOptionsFactory}
    >
      {renderInner}
    </InfiniteGroupKeys>
  );
}

// ============================================================================
// Page Query Bridge Inner Component
// ============================================================================

interface PageQueryBridgeInnerProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  children: ReactNode;
  column: ColumnConfig | null;
  columnCounts?: GroupCounts;
  cursors: Cursors;
  defaultExpanded?: string[];
  filter: WhereNode[] | null;
  group: GroupConfigInput | null;
  groupCounts: GroupQueryResponse["counts"];
  groupKeys: string[];
  groupSortValues: GroupQueryResponse["sortValues"];
  hasNextGroupPage: boolean;
  isFetchingNextGroupPage: boolean;
  isPending: boolean;
  limit: Limit;
  onLoadMoreGroups: () => void;
  queryOptionsFactory: (params: unknown) => unknown;
  search: string;
  setColumn: (column: ColumnConfigInput | null) => void;
  setCursor: (groupKey: string, cursor: CursorValue | null) => void;
  setFilter: (filter: WhereNode[] | null) => void;
  setGroup: (group: GroupConfigInput | null) => void;
  setLimit: (limit: Limit) => void;
  setSearch: (search: string) => void;
  setSort: (sort: SortQuery[]) => void;
  sort: SortQuery[];
  viewProps: Omit<
    DataViewProviderProps<TData, TProperties>,
    | "children"
    | "counts"
    | "data"
    | "defaults"
    | "expandedGroups"
    | "filter"
    | "onExpandedGroupsChange"
    | "pagination"
    | "search"
    | "sort"
  > & {
    columnCounts?: GroupCounts;
    counts?: Partial<ViewCounts>;
  };
}

/**
 * Inner component that receives group data as props.
 * Handles expanded state and context provision.
 */
function PageQueryBridgeInner<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  children,
  column,
  cursors,
  defaultExpanded,
  filter,
  group,
  groupCounts,
  groupKeys,
  groupSortValues,
  hasNextGroupPage,
  isFetchingNextGroupPage,
  isPending,
  limit,
  onLoadMoreGroups,
  queryOptionsFactory,
  search,
  setColumn,
  setCursor,
  setFilter,
  setGroup,
  setLimit,
  setSearch,
  setSort,
  sort,
  viewProps,
}: PageQueryBridgeInnerProps<TData, TProperties>) {
  // Get property visibility from toolbar context
  const { propertyVisibility } = useToolbarContext();

  // ============================================================================
  // Expanded State
  // ============================================================================

  // Compute initial expanded value
  const getInitialExpanded = useCallback(() => {
    if (defaultExpanded && defaultExpanded.length > 0) {
      return defaultExpanded;
    }
    // Flat mode (not grouped) - always expand to show data
    if (groupKeys.length === 1 && groupKeys[0] === "__ungrouped__") {
      return ["__ungrouped__"];
    }
    // Grouped mode - collapse all by default
    return [];
  }, [defaultExpanded, groupKeys]);

  // Local state for expanded groups (not persisted to URL)
  const [localExpanded, setLocalExpanded] =
    useState<string[]>(getInitialExpanded);

  // Track groupKeys for detecting changes
  const prevGroupKeysRef = useRef(groupKeys);

  // Handle groupKeys changes (e.g., switching between flat/grouped mode)
  useEffect(() => {
    const prevKeys = prevGroupKeysRef.current;
    const keysChanged =
      prevKeys.length !== groupKeys.length ||
      prevKeys.some((k, i) => k !== groupKeys[i]);

    if (keysChanged) {
      prevGroupKeysRef.current = groupKeys;
      setLocalExpanded(getInitialExpanded());
    }
  }, [groupKeys, getInitialExpanded]);

  const setExpandedGroups = useCallback((groups: string[]) => {
    setLocalExpanded(groups);
  }, []);

  // Reset expanded groups when group config changes
  const handleSetGroup = useCallback(
    (newGroup: GroupConfigInput | null) => {
      setGroup(newGroup);
      setLocalExpanded([]);
    },
    [setGroup]
  );

  // ============================================================================
  // Build Runtime State for Context
  // ============================================================================

  const runtimeState = useMemo<QueryRuntimeState>(
    () => ({
      cursors,
      expandedGroups: localExpanded,
      filter,
      group,
      groupCounts,
      groupKeys,
      groupSortValues,
      hasNextGroupPage,
      isFetchingNextGroupPage,
      isPending,
      limit,
      onLoadMoreGroups,
      queryOptionsFactory: queryOptionsFactory as (params: unknown) => unknown,
      search,
      setCursor,
      setExpandedGroups,
      setFilter,
      setGroup: handleSetGroup,
      setLimit,
      setSearch,
      setSort,
      sort,
      type: "page",
    }),
    [
      cursors,
      localExpanded,
      filter,
      group,
      groupCounts,
      groupKeys,
      groupSortValues,
      hasNextGroupPage,
      isFetchingNextGroupPage,
      isPending,
      limit,
      onLoadMoreGroups,
      queryOptionsFactory,
      search,
      setCursor,
      setExpandedGroups,
      setFilter,
      handleSetGroup,
      setLimit,
      setSearch,
      setSort,
      sort,
    ]
  );

  // ============================================================================
  // Build Output
  // ============================================================================

  // All views use SuspendingGroupContent for data fetching
  // Pagination groups are empty - views use groupKeys + SuspendingGroupContent
  const pagination: PagePaginationState<TData> = useMemo(
    () => ({
      groups: [],
      limit,
      onLimitChange: setLimit,
    }),
    [limit, setLimit]
  );

  const mergedCounts: ViewCounts = useMemo(
    () => ({
      group: groupCounts ?? {},
      groupSortValues: groupSortValues ?? {},
      ...viewProps.counts,
    }),
    [groupCounts, groupSortValues, viewProps.counts]
  );

  return (
    <QueryControllerContext.Provider value={runtimeState}>
      <DataViewProviderCore<TData, TProperties>
        {...(viewProps as DataViewProviderProps<TData, TProperties>)}
        column={column}
        columnCounts={viewProps.columnCounts}
        counts={mergedCounts}
        data={[]}
        expandedGroups={localExpanded}
        filter={filter}
        group={group}
        groupKeys={groupKeys}
        hasNextGroupPage={hasNextGroupPage}
        isFetchingNextGroupPage={isFetchingNextGroupPage}
        limit={limit}
        onColumnChange={setColumn}
        onExpandedGroupsChange={setExpandedGroups}
        onLoadMoreGroups={onLoadMoreGroups}
        pagination={pagination}
        propertyVisibility={propertyVisibility}
        search={search}
        sort={sort}
      >
        {children}
      </DataViewProviderCore>
    </QueryControllerContext.Provider>
  );
}

// ============================================================================
// Infinite Query Bridge
// ============================================================================

interface InfiniteQueryBridgeProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
  TQueryOptions,
> {
  children: ReactNode;
  controller: InfinitePaginationController<TQueryOptions>;
  defaults?: DefaultsConfig;
  viewProps: Omit<
    DataViewProviderProps<TData, TProperties>,
    | "children"
    | "counts"
    | "data"
    | "defaults"
    | "expandedGroups"
    | "filter"
    | "onExpandedGroupsChange"
    | "pagination"
    | "search"
    | "sort"
  > & {
    columnCounts?: GroupCounts;
    counts?: Partial<ViewCounts>;
  };
}

/**
 * InfiniteQueryBridge - Orchestrates infinite query execution and data aggregation.
 *
 * Owns nuqs hooks for URL state management internally, keeping re-renders
 * scoped to this component and its children only.
 *
 * For grouped mode, uses SuspendingGroupKeys to suspend until group keys are available,
 * preventing the "flat view flash" during initial load.
 */
export function InfiniteQueryBridge<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
  TQueryOptions,
>({
  children,
  controller,
  defaults,
  viewProps,
}: InfiniteQueryBridgeProps<TData, TProperties, TQueryOptions>) {
  const {
    columnQueryOptionsFactory,
    groupQueryOptionsFactory,
    queryOptionsFactory,
  } = controller;

  // Defaults from provider props
  const {
    column: defaultColumn = null,
    expanded: defaultExpanded,
    filter: defaultFilter = null,
    group: defaultGroup = null,
    limit: defaultLimit = 25,
    search: defaultSearch = "",
    sort: defaultSort = [],
  } = defaults ?? {};

  const [isPending, startTransition] = useTransition();

  // ============================================================================
  // URL State via nuqs
  // ============================================================================

  const [urlColumn, setUrlColumn] = useQueryState(
    "column",
    parseAsColumnBy.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlLimit, setUrlLimit] = useQueryState(
    "limit",
    parseAsInteger.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlFilter, setUrlFilter] = useQueryState(
    "filter",
    parseAsFilter.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlSort, setUrlSort] = useQueryState(
    "sort",
    parseAsSort.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlSearch, setUrlSearch] = useQueryState(
    "search",
    parseAsString.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlGroup, setUrlGroup] = useQueryState(
    "group",
    parseAsGroupBy.withOptions({ throttleMs: THROTTLE_MS })
  );

  // ============================================================================
  // Current Values (URL ?? defaults)
  // ============================================================================

  const column = urlColumn ?? defaultColumn;
  const filter = urlFilter ?? defaultFilter;
  const sort = urlSort ?? defaultSort;
  const search = urlSearch ?? defaultSearch;
  const group = urlGroup ?? defaultGroup;
  const limit = (urlLimit ?? defaultLimit) as Limit;

  // ============================================================================
  // Column & Group Mode Detection
  // ============================================================================

  // Column mode (board-specific): visual columns across the board
  // Only active if we have BOTH a column config AND a factory to fetch column counts
  const hasColumnMode = Boolean(column && columnQueryOptionsFactory);

  // Extract column config for query (uses same structure as group)
  const columnByConfig = useMemo(
    () => (column ? getGroupByConfig(column) : null),
    [column]
  );

  // Group mode (accordion rows): vertical grouping within each column
  // Only active if we have BOTH a group config AND a factory to fetch group keys
  const isGrouped = Boolean(group && groupQueryOptionsFactory);

  // Extract only structural config (without sort/hideEmpty) for query
  const groupByConfig = useMemo(() => getGroupByConfig(group), [group]);

  // ============================================================================
  // Setters (defined before use in inner component)
  // ============================================================================

  const setColumn = useCallback(
    (newColumn: ColumnConfigInput | null) => {
      startTransition(() => {
        setUrlColumn(newColumn);
      });
    },
    [setUrlColumn]
  );

  const setLimit = useCallback(
    (newLimit: Limit) => {
      startTransition(() => {
        setUrlLimit(newLimit);
      });
    },
    [setUrlLimit]
  );

  const setFilter = useCallback(
    (newFilter: WhereNode[] | null) => {
      startTransition(() => {
        setUrlFilter(newFilter);
      });
    },
    [setUrlFilter]
  );

  const setSort = useCallback(
    (newSort: SortQuery[]) => {
      startTransition(() => {
        setUrlSort(newSort.length > 0 ? newSort : null);
      });
    },
    [setUrlSort]
  );

  const setSearch = useCallback(
    (newSearch: string) => {
      startTransition(() => {
        setUrlSearch(newSearch || null);
      });
    },
    [setUrlSearch]
  );

  const setGroup = useCallback(
    (newGroup: GroupConfigInput | null) => {
      startTransition(() => {
        setUrlGroup(newGroup);
      });
    },
    [setUrlGroup]
  );

  // ============================================================================
  // Render Inner Component with Column & Group Data
  // ============================================================================

  // Noop for flat mode (no group pagination)
  const noopLoadMoreGroups = useCallback(() => {
    /* no-op */
  }, []);

  // Inner component that receives column and group data as props
  const renderInner = useCallback(
    ({
      columnCounts,
      groupCounts,
      groupKeys,
      groupSortValues,
      hasNextGroupPage,
      isFetchingNextGroupPage,
      onLoadMoreGroups,
    }: {
      columnCounts: GroupQueryResponse["counts"];
      groupCounts: GroupQueryResponse["counts"];
      groupKeys: string[];
      groupSortValues: GroupQueryResponse["sortValues"];
      hasNextGroupPage: boolean;
      isFetchingNextGroupPage: boolean;
      onLoadMoreGroups: () => void;
    }) => (
      <InfiniteQueryBridgeInner<TData, TProperties>
        column={column}
        columnCounts={columnCounts}
        defaultExpanded={defaultExpanded}
        filter={filter}
        group={group}
        groupCounts={groupCounts}
        groupKeys={groupKeys}
        groupSortValues={groupSortValues}
        hasNextGroupPage={hasNextGroupPage}
        isFetchingNextGroupPage={isFetchingNextGroupPage}
        isPending={isPending}
        limit={limit}
        onLoadMoreGroups={onLoadMoreGroups}
        queryOptionsFactory={
          queryOptionsFactory as (params: unknown) => unknown
        }
        search={search}
        setColumn={setColumn}
        setFilter={setFilter}
        setGroup={setGroup}
        setLimit={setLimit}
        setSearch={setSearch}
        setSort={setSort}
        sort={sort}
        viewProps={viewProps}
      >
        {children}
      </InfiniteQueryBridgeInner>
    ),
    [
      children,
      column,
      defaultExpanded,
      filter,
      group,
      isPending,
      limit,
      queryOptionsFactory,
      search,
      setColumn,
      setFilter,
      setGroup,
      setLimit,
      setSearch,
      setSort,
      sort,
      viewProps,
    ]
  );

  // ============================================================================
  // Render with Column & Group Data Fetching
  // ============================================================================

  // Helper to wrap with group suspense if needed
  const wrapWithGroupSuspense = (
    columnCounts: GroupQueryResponse["counts"]
  ) => {
    if (isGrouped && groupByConfig && groupQueryOptionsFactory) {
      return (
        <InfiniteGroupKeys
          groupByConfig={groupByConfig}
          groupQueryOptionsFactory={groupQueryOptionsFactory}
        >
          {({
            groupCounts,
            groupKeys,
            groupSortValues,
            hasNextGroupPage,
            isFetchingNextGroupPage,
            onLoadMoreGroups,
          }) =>
            renderInner({
              columnCounts,
              groupCounts,
              groupKeys,
              groupSortValues,
              hasNextGroupPage,
              isFetchingNextGroupPage,
              onLoadMoreGroups,
            })
          }
        </InfiniteGroupKeys>
      );
    }
    // No group mode - use flat mode with __ungrouped__
    return renderInner({
      columnCounts,
      groupCounts: undefined,
      groupKeys: ["__ungrouped__"],
      groupSortValues: undefined,
      hasNextGroupPage: false,
      isFetchingNextGroupPage: false,
      onLoadMoreGroups: noopLoadMoreGroups,
    });
  };

  // If column mode is active, wrap with column suspense first
  if (hasColumnMode && columnByConfig && columnQueryOptionsFactory) {
    return (
      <SuspendingColumnKeys
        columnByConfig={columnByConfig}
        columnQueryOptionsFactory={columnQueryOptionsFactory}
      >
        {({ columnCounts }) => wrapWithGroupSuspense(columnCounts)}
      </SuspendingColumnKeys>
    );
  }

  // No column mode - just handle groups (or flat)
  return wrapWithGroupSuspense(undefined);
}

// ============================================================================
// Infinite Query Bridge Inner Component
// ============================================================================

interface InfiniteQueryBridgeInnerProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  children: ReactNode;
  column: ColumnConfig | null;
  columnCounts?: GroupCounts;
  defaultExpanded?: string[];
  filter: WhereNode[] | null;
  group: GroupConfigInput | null;
  groupCounts: GroupQueryResponse["counts"];
  groupKeys: string[];
  groupSortValues: GroupQueryResponse["sortValues"];
  hasNextGroupPage: boolean;
  isFetchingNextGroupPage: boolean;
  isPending: boolean;
  limit: Limit;
  onLoadMoreGroups: () => void;
  queryOptionsFactory: (params: unknown) => unknown;
  search: string;
  setColumn: (column: ColumnConfigInput | null) => void;
  setFilter: (filter: WhereNode[] | null) => void;
  setGroup: (group: GroupConfigInput | null) => void;
  setLimit: (limit: Limit) => void;
  setSearch: (search: string) => void;
  setSort: (sort: SortQuery[]) => void;
  sort: SortQuery[];
  viewProps: Omit<
    DataViewProviderProps<TData, TProperties>,
    | "children"
    | "counts"
    | "data"
    | "defaults"
    | "expandedGroups"
    | "filter"
    | "onExpandedGroupsChange"
    | "pagination"
    | "search"
    | "sort"
  > & {
    columnCounts?: GroupCounts;
    counts?: Partial<ViewCounts>;
  };
}

/**
 * Inner component that receives group data as props.
 * Handles expanded state and context provision for infinite pagination.
 */
function InfiniteQueryBridgeInner<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  children,
  column,
  columnCounts,
  defaultExpanded,
  filter,
  group,
  groupCounts,
  groupKeys,
  groupSortValues,
  hasNextGroupPage,
  isFetchingNextGroupPage,
  isPending,
  limit,
  onLoadMoreGroups,
  queryOptionsFactory,
  search,
  setColumn,
  setFilter,
  setGroup,
  setLimit,
  setSearch,
  setSort,
  sort,
  viewProps,
}: InfiniteQueryBridgeInnerProps<TData, TProperties>) {
  // Get property visibility from toolbar context
  const { propertyVisibility } = useToolbarContext();

  // ============================================================================
  // Expanded State
  // ============================================================================

  // Compute initial expanded value
  const getInitialExpanded = useCallback(() => {
    if (defaultExpanded && defaultExpanded.length > 0) {
      return defaultExpanded;
    }
    // Flat mode (not grouped) - always expand to show data
    if (groupKeys.length === 1 && groupKeys[0] === "__ungrouped__") {
      return ["__ungrouped__"];
    }
    // Grouped mode - collapse all by default
    return [];
  }, [defaultExpanded, groupKeys]);

  // Local state for expanded groups (not persisted to URL)
  const [localExpanded, setLocalExpanded] =
    useState<string[]>(getInitialExpanded);

  // Track groupKeys for detecting changes
  const prevGroupKeysRef = useRef(groupKeys);

  // Handle groupKeys changes (e.g., switching between flat/grouped mode)
  useEffect(() => {
    const prevKeys = prevGroupKeysRef.current;
    const keysChanged =
      prevKeys.length !== groupKeys.length ||
      prevKeys.some((k, i) => k !== groupKeys[i]);

    if (keysChanged) {
      prevGroupKeysRef.current = groupKeys;
      setLocalExpanded(getInitialExpanded());
    }
  }, [groupKeys, getInitialExpanded]);

  const setExpandedGroups = useCallback((groups: string[]) => {
    setLocalExpanded(groups);
  }, []);

  // Reset expanded groups when group config changes
  const handleSetGroup = useCallback(
    (newGroup: GroupConfigInput | null) => {
      setGroup(newGroup);
      setLocalExpanded([]);
    },
    [setGroup]
  );

  // ============================================================================
  // Build Runtime State for Context
  // ============================================================================

  // Infinite pagination doesn't use cursors (TanStack Query manages them internally)
  const runtimeState = useMemo<QueryRuntimeState>(
    () => ({
      cursors: {},
      expandedGroups: localExpanded,
      filter,
      group,
      groupCounts,
      groupKeys,
      groupSortValues,
      hasNextGroupPage,
      isFetchingNextGroupPage,
      isPending,
      limit,
      onLoadMoreGroups,
      queryOptionsFactory: queryOptionsFactory as (params: unknown) => unknown,
      search,
      setCursor: noopSetCursor,
      setExpandedGroups,
      setFilter,
      setGroup: handleSetGroup,
      setLimit,
      setSearch,
      setSort,
      sort,
      type: "infinite",
    }),
    [
      localExpanded,
      filter,
      group,
      groupCounts,
      groupKeys,
      groupSortValues,
      hasNextGroupPage,
      isFetchingNextGroupPage,
      isPending,
      limit,
      onLoadMoreGroups,
      queryOptionsFactory,
      search,
      setExpandedGroups,
      setFilter,
      handleSetGroup,
      setLimit,
      setSearch,
      setSort,
      sort,
    ]
  );

  // ============================================================================
  // Build Output
  // ============================================================================

  // All views use SuspendingGroupContent for data fetching
  // Pagination groups are empty - views use groupKeys + SuspendingGroupContent
  const pagination: InfinitePaginationState<TData> = useMemo(
    () => ({
      groups: [],
      limit,
      onLimitChange: setLimit,
    }),
    [limit, setLimit]
  );

  const mergedCounts: ViewCounts = useMemo(
    () => ({
      group: groupCounts ?? {},
      groupSortValues: groupSortValues ?? {},
      ...viewProps.counts,
    }),
    [groupCounts, groupSortValues, viewProps.counts]
  );

  return (
    <QueryControllerContext.Provider value={runtimeState}>
      <DataViewProviderCore<TData, TProperties>
        {...(viewProps as DataViewProviderProps<TData, TProperties>)}
        column={column}
        columnCounts={columnCounts}
        counts={mergedCounts}
        data={[]}
        expandedGroups={localExpanded}
        filter={filter}
        group={group}
        groupKeys={groupKeys}
        hasNextGroupPage={hasNextGroupPage}
        isFetchingNextGroupPage={isFetchingNextGroupPage}
        limit={limit}
        onColumnChange={setColumn}
        onExpandedGroupsChange={setExpandedGroups}
        onLoadMoreGroups={onLoadMoreGroups}
        pagination={pagination}
        propertyVisibility={propertyVisibility}
        search={search}
        sort={sort}
      >
        {children}
      </DataViewProviderCore>
    </QueryControllerContext.Provider>
  );
}
