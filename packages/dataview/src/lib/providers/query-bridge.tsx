"use client";

import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useDeferredValue,
  useMemo,
} from "react";
import { useExpandedGroups } from "../../hooks/use-expanded-groups";
import type { SortQuery, WhereNode } from "../../types/filter.type";
import type {
  ColumnConfigInput,
  GroupConfigInput,
} from "../../types/group.type";
import type { Limit } from "../../types/pagination";
import type {
  InfiniteController,
  PageController,
} from "../../types/pagination-controller";
import type {
  Cursors,
  CursorValue,
  GroupCounts,
  ViewCounts,
} from "../../types/pagination-types";
import type { DataViewProperty } from "../../types/property.type";
import {
  type CoreProviderProps,
  DataViewProviderCore,
} from "./data-view-provider";
import {
  useQueryParamsActions,
  useQueryParamsState,
} from "./query-params-context";
import { useToolbarContext } from "./toolbar-context";

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract the structural parts of a group config plus sort (without hideEmpty).
 * Sort affects server-side ordering, so it must be included in the query.
 * hideEmpty is display-only and doesn't affect the group list.
 */
function getGroupByConfig(
  group: GroupConfigInput | null
): GroupConfigInput | null {
  if (!group) {
    return null;
  }

  // Extract the core group config plus sort, excluding hideEmpty
  // With the new canonical structure, we just need to spread the config
  // and exclude hideEmpty since it's display-only
  const { hideEmpty: _, ...configWithoutHideEmpty } = group;

  return configWithoutHideEmpty;
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
  dataQuery: (params: unknown) => unknown;
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
  filter: WhereNode[] | null;
  groupByConfig: GroupConfigInput;
  // Accept any function that returns infinite query options (tRPC or manual)
  groupQuery: (params: {
    filter: WhereNode[] | null;
    groupConfig: GroupConfigInput;
    hideEmpty: boolean;
    search: string;
    // biome-ignore lint/suspicious/noExplicitAny: Must accept tRPC's infiniteQueryOptions return type
  }) => any;
  hideEmpty: boolean;
  search: string;
}

/**
 * Suspending component that fetches group keys using useSuspenseInfiniteQuery.
 * This ensures the parent suspends until group keys are available,
 * preventing the "flat view flash" when loading grouped views.
 * Supports infinite pagination for loading more groups.
 */
function InfiniteGroupKeys({
  children,
  filter,
  groupByConfig,
  groupQuery,
  hideEmpty,
  search,
}: InfiniteGroupKeysProps) {
  // Defer filter/search/hideEmpty to prevent re-suspending on changes
  // This keeps previous group keys visible while new data loads
  // Note: groupByConfig is NOT deferred - structural changes show skeleton
  const deferredFilter = useDeferredValue(filter);
  const deferredSearch = useDeferredValue(search);
  const deferredHideEmpty = useDeferredValue(hideEmpty);

  const factoryOptions = groupQuery({
    filter: deferredFilter,
    groupConfig: groupByConfig,
    hideEmpty: deferredHideEmpty,
    search: deferredSearch,
  });

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
  columnQuery: (params: {
    columnConfig: GroupConfigInput;
    filter: WhereNode[] | null;
    hideEmpty: boolean;
    search: string;
  }) => {
    queryFn?: unknown;
    queryKey: readonly unknown[];
  };
  filter: WhereNode[] | null;
  hideEmpty: boolean;
  search: string;
}

/**
 * Suspending component that fetches column keys using useSuspenseQuery.
 * Board-specific: ensures columns are available before rendering board structure.
 */
function SuspendingColumnKeys({
  children,
  columnByConfig,
  columnQuery,
  filter,
  hideEmpty,
  search,
}: SuspendingColumnKeysProps) {
  // Defer filter/search/hideEmpty to prevent re-suspending on changes
  // This keeps previous column keys visible while new data loads
  // Note: columnByConfig is NOT deferred - structural changes show skeleton
  const deferredFilter = useDeferredValue(filter);
  const deferredSearch = useDeferredValue(search);
  const deferredHideEmpty = useDeferredValue(hideEmpty);

  const factoryOptions = columnQuery({
    columnConfig: columnByConfig,
    filter: deferredFilter,
    hideEmpty: deferredHideEmpty,
    search: deferredSearch,
  });
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
  column?: ColumnConfigInput | null;
  expanded?: string[];
  filter?: WhereNode[] | null;
  group?: GroupConfigInput | null;
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
  controller: PageController<TQueryOptions>;
  defaults?: DefaultsConfig;
  viewProps: Omit<
    CoreProviderProps<TData, TProperties>,
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
 * Consumes validated state from QueryParamsContext (single source of truth).
 * URL state and validation are managed by QueryParamsProvider (parent).
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
  const { dataQuery, groupQuery } = controller;

  // Defaults for expanded groups (not managed by QueryParamsContext)
  const { expanded: defaultExpanded } = defaults ?? {};

  // ============================================================================
  // Consume from QueryParamsContext (single source of truth)
  // ============================================================================

  const queryParamsState = useQueryParamsState();
  const queryParamsActions = useQueryParamsActions();

  const { column, cursors, filter, group, isPending, limit, search, sort } =
    queryParamsState;

  const {
    setColumn,
    setCursor,
    setFilter,
    setGroup,
    setLimit,
    setSearch,
    setSort,
  } = queryParamsActions;

  // ============================================================================
  // Group Mode Detection
  // ============================================================================

  // For accordion grouping: use `group` config (NOT column)
  // - `column` is board-specific visual organization (handled via columnCounts prop)
  // - `group` is accordion-style data grouping (handled via groupQuery)
  // Only grouped mode if we have BOTH a group config AND a factory to fetch group keys
  const isGrouped = Boolean(group && groupQuery);

  // Extract only structural config (without sort/hideEmpty) for query
  const groupByConfig = useMemo(() => getGroupByConfig(group), [group]);

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
        dataQuery={dataQuery as (params: unknown) => unknown}
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
      dataQuery,
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
  if (!(isGrouped && groupByConfig && groupQuery)) {
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
      filter={filter}
      groupByConfig={groupByConfig}
      groupQuery={groupQuery}
      hideEmpty={group?.hideEmpty ?? false}
      search={search}
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
  column: ColumnConfigInput | null;
  columnCounts?: GroupCounts;
  cursors: Cursors;
  dataQuery: (params: unknown) => unknown;
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
    CoreProviderProps<TData, TProperties>,
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
  dataQuery,
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

  const { expandedGroups, handleSetGroup, setExpandedGroups } =
    useExpandedGroups({
      defaultExpanded,
      groupKeys,
      setGroup,
    });

  // ============================================================================
  // Build Runtime State for Context
  // ============================================================================

  const runtimeState = useMemo<QueryRuntimeState>(
    () => ({
      cursors,
      expandedGroups,
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
      dataQuery: dataQuery as (params: unknown) => unknown,
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
      expandedGroups,
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
      dataQuery,
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
        {...(viewProps as CoreProviderProps<TData, TProperties>)}
        column={column}
        columnCounts={viewProps.columnCounts}
        counts={mergedCounts}
        data={[]}
        expandedGroups={expandedGroups}
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
  controller: InfiniteController<TQueryOptions>;
  defaults?: DefaultsConfig;
  viewProps: Omit<
    CoreProviderProps<TData, TProperties>,
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
 * Consumes validated state from QueryParamsContext (single source of truth).
 * URL state and validation are managed by QueryParamsProvider (parent).
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
  const { columnQuery, groupQuery, dataQuery } = controller;

  // Defaults for expanded groups (not managed by QueryParamsContext)
  const { expanded: defaultExpanded } = defaults ?? {};

  // ============================================================================
  // Consume from QueryParamsContext (single source of truth)
  // ============================================================================

  const queryParamsState = useQueryParamsState();
  const queryParamsActions = useQueryParamsActions();

  const { column, filter, group, isPending, limit, search, sort } =
    queryParamsState;

  const { setColumn, setFilter, setGroup, setLimit, setSearch, setSort } =
    queryParamsActions;

  // ============================================================================
  // Column & Group Mode Detection
  // ============================================================================

  // Column mode (board-specific): visual columns across the board
  // Only active if we have BOTH a column config AND a factory to fetch column counts
  const hasColumnMode = Boolean(column && columnQuery);

  // Extract column config for query (uses same structure as group)
  const columnByConfig = useMemo(
    () => (column ? getGroupByConfig(column) : null),
    [column]
  );

  // Group mode (accordion rows): vertical grouping within each column
  // Only active if we have BOTH a group config AND a factory to fetch group keys
  const isGrouped = Boolean(group && groupQuery);

  // Extract only structural config (without sort/hideEmpty) for query
  const groupByConfig = useMemo(() => getGroupByConfig(group), [group]);

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
        dataQuery={dataQuery as (params: unknown) => unknown}
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
      dataQuery,
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
    if (isGrouped && groupByConfig && groupQuery) {
      return (
        <InfiniteGroupKeys
          filter={filter}
          groupByConfig={groupByConfig}
          groupQuery={groupQuery}
          hideEmpty={group?.hideEmpty ?? false}
          search={search}
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
  if (hasColumnMode && columnByConfig && columnQuery) {
    return (
      <SuspendingColumnKeys
        columnByConfig={columnByConfig}
        columnQuery={columnQuery}
        filter={filter}
        hideEmpty={column?.hideEmpty ?? false}
        search={search}
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
  column: ColumnConfigInput | null;
  columnCounts?: GroupCounts;
  dataQuery: (params: unknown) => unknown;
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
  search: string;
  setColumn: (column: ColumnConfigInput | null) => void;
  setFilter: (filter: WhereNode[] | null) => void;
  setGroup: (group: GroupConfigInput | null) => void;
  setLimit: (limit: Limit) => void;
  setSearch: (search: string) => void;
  setSort: (sort: SortQuery[]) => void;
  sort: SortQuery[];
  viewProps: Omit<
    CoreProviderProps<TData, TProperties>,
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
  dataQuery,
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

  const { expandedGroups, handleSetGroup, setExpandedGroups } =
    useExpandedGroups({
      defaultExpanded,
      groupKeys,
      setGroup,
    });

  // ============================================================================
  // Build Runtime State for Context
  // ============================================================================

  // Infinite pagination doesn't use cursors (TanStack Query manages them internally)
  const runtimeState = useMemo<QueryRuntimeState>(
    () => ({
      cursors: {},
      expandedGroups,
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
      dataQuery: dataQuery as (params: unknown) => unknown,
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
      expandedGroups,
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
      dataQuery,
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
        {...(viewProps as CoreProviderProps<TData, TProperties>)}
        column={column}
        columnCounts={columnCounts}
        counts={mergedCounts}
        data={[]}
        expandedGroups={expandedGroups}
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
