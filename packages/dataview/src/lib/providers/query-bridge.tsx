"use client";

import type { Limit, SortQuery, WhereNode } from "@sparkyidea/shared/types";
import { parseAsFilter } from "@sparkyidea/shared/utils/parsers/filter";
import {
  type GroupConfigInput,
  parseAsGroupBy,
} from "@sparkyidea/shared/utils/parsers/group";
import {
  parseAsCursors,
  parseAsExpanded,
} from "@sparkyidea/shared/utils/parsers/pagination";
import { parseAsSort } from "@sparkyidea/shared/utils/parsers/sort";
import { useQuery } from "@tanstack/react-query";
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
import type { GroupConfig, SubGroupConfig } from "../../types/group-types";
import type {
  InfinitePaginationController,
  PagePaginationController,
} from "../../types/pagination-controller";
import type {
  Cursors,
  CursorValue,
  ViewCounts,
} from "../../types/pagination-types";
import type { DataViewProperty } from "../../types/property.type";
import {
  DataViewProvider as DataViewProviderCore,
  type DataViewProviderProps,
} from "./data-view-provider";
import { PaginationStateProvider } from "./pagination-state-context";

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

/**
 * Extract the structural key from a group config.
 * Only the group type and property matter for determining if groups change.
 * Sorting, showCount, etc. don't affect which groups exist.
 */
function getGroupStructuralKey(group: GroupConfigInput | null): string | null {
  if (!group) {
    return null;
  }

  if ("bySelect" in group) {
    return `select:${group.bySelect.property}`;
  }
  if ("byStatus" in group) {
    return `status:${group.byStatus.property}`;
  }
  if ("byCheckbox" in group) {
    return `checkbox:${group.byCheckbox.property}`;
  }
  if ("byDate" in group) {
    return `date:${group.byDate.property}:${group.byDate.showAs}`;
  }
  if ("byMultiSelect" in group) {
    return `multiselect:${group.byMultiSelect.property}`;
  }
  if ("byText" in group) {
    return `text:${group.byText.property}`;
  }
  if ("byNumber" in group) {
    return `number:${group.byNumber.property}`;
  }

  return JSON.stringify(group);
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
  isLoading: boolean;
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
  isLoading: boolean;
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
  isLoading: boolean;
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
  isLoading: boolean;
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

  // Meta
  isPending: boolean;
  limit: Limit;
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
  setSubGroup: (subGroup: GroupConfigInput | null) => void;
  sort: SortQuery[];
  subGroup: GroupConfigInput | null;

  // SubGroup counts (board-specific)
  subGroupCounts?: Record<string, { count?: number; hasMore?: boolean }>;
  subGroupKeys?: string[];
  subGroupSortValues?: Record<string, string | number>;

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
// Page Query Bridge
// ============================================================================

interface StoredPageQueryResult<TData> {
  data: TData[];
  displayEnd: number;
  displayStart: number;
  hasNext: boolean;
  hasPrev: boolean;
  isFetching: boolean;
  isPending: boolean;
  isPlaceholderData: boolean;
  onLimitChange: (limit: Limit) => void;
  onNext: () => void;
  onPrev: () => void;
}

const noop = () => {
  /* no-op */
};

// Typed noop for setCursor (infinite pagination doesn't use cursors)
const noopSetCursor = (_groupKey: string, _cursor: CursorValue | null) => {
  /* no-op */
};

/**
 * URL defaults configuration.
 */
interface DefaultsConfig {
  expanded?: string[];
  filter?: WhereNode[] | null;
  group?: GroupConfig | null;
  limit?: Limit;
  search?: string;
  sort?: SortQuery[];
  subGroup?: SubGroupConfig | null;
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
    counts?: Partial<ViewCounts>;
  };
}

/**
 * PageQueryBridge - Orchestrates page-based query execution and data aggregation.
 *
 * Owns nuqs hooks for URL state management internally, keeping re-renders
 * scoped to this component and its children only.
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
  const {
    groupQueryOptionsFactory,
    queryOptionsFactory,
    subGroupQueryOptionsFactory,
  } = controller;

  // Defaults from provider props
  const {
    expanded: defaultExpanded,
    filter: defaultFilter = null,
    group: defaultGroup = null,
    limit: defaultLimit = 10,
    search: defaultSearch = "",
    sort: defaultSort = [],
    subGroup: defaultSubGroup = null,
  } = defaults ?? {};

  const [isPending, startTransition] = useTransition();

  // Track if this is an internal change (user interaction) vs external (navigation)
  const isInternalChange = useRef(false);

  // ============================================================================
  // URL State via nuqs
  // ============================================================================

  const [urlCursors, setUrlCursors] = useQueryState(
    "cursors",
    parseAsCursors.withOptions({ throttleMs: THROTTLE_MS })
  );
  const [urlExpanded, setUrlExpanded] = useQueryState(
    "expanded",
    parseAsExpanded.withOptions({ throttleMs: THROTTLE_MS })
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
  const [urlSubGroup, setUrlSubGroup] = useQueryState(
    "subGroup",
    parseAsGroupBy.withOptions({ throttleMs: THROTTLE_MS })
  );

  // ============================================================================
  // Current Values (URL ?? defaults)
  // ============================================================================

  const cursors = urlCursors ?? {};
  const filter = urlFilter ?? defaultFilter;
  const sort = urlSort ?? defaultSort;
  const search = urlSearch ?? defaultSearch;
  const group = urlGroup ?? defaultGroup;
  const subGroup = urlSubGroup ?? defaultSubGroup;
  const limit = (urlLimit ?? defaultLimit) as Limit;

  // ============================================================================
  // Internal Group Fetching
  // ============================================================================

  const isGrouped = Boolean(group);

  // Extract only structural config (without sort/hideEmpty) for query
  const groupByConfig = useMemo(() => getGroupByConfig(group), [group]);

  // Build group query options using only structural config
  const groupQueryOptions = useMemo(() => {
    if (!(groupByConfig && groupQueryOptionsFactory)) {
      return {
        queryKey: ["__disabled__"] as const,
        queryFn: () => Promise.resolve(null),
        enabled: false,
      };
    }
    const factoryOptions = groupQueryOptionsFactory(groupByConfig);
    return {
      ...factoryOptions,
      queryKey: factoryOptions.queryKey,
      queryFn: factoryOptions.queryFn as () => Promise<unknown>,
      enabled: true,
    };
  }, [groupByConfig, groupQueryOptionsFactory]);

  // Type for group query response
  interface GroupQueryResponse {
    counts?: Record<string, { count: number; hasMore: boolean }>;
    sortValues?: Record<string, string | number>;
  }

  const {
    data: rawGroupData,
    isFetching: isGroupFetching,
    isLoading: isGroupLoading,
  } = useQuery(groupQueryOptions);

  // Cast to proper type
  const groupData = rawGroupData as GroupQueryResponse | null | undefined;

  // Track which group STRUCTURE the data corresponds to (stale data fix)
  // Only the group type + property matter - sorting/showCount don't affect which groups exist
  const groupStructuralKey = useMemo(
    () => getGroupStructuralKey(group),
    [group]
  );
  const [lastFetchedStructuralKey, setLastFetchedStructuralKey] = useState<
    string | null
  >(() => getGroupStructuralKey(group));

  useEffect(() => {
    if (!isGroupFetching && groupData) {
      setLastFetchedStructuralKey(groupStructuralKey);
    }
  }, [isGroupFetching, groupData, groupStructuralKey]);

  // Data is stale only when group STRUCTURE changed (property/type, not sorting)
  const isGroupDataStale =
    isGrouped &&
    lastFetchedStructuralKey !== null &&
    lastFetchedStructuralKey !== groupStructuralKey;

  // Compute groupKeys from internal data
  const groupKeys = useMemo(() => {
    if (!isGrouped) {
      return ["__ungrouped__"]; // Flat mode
    }
    if (isGroupDataStale || isGroupLoading) {
      return []; // Loading/stale - show empty
    }
    return Object.keys(groupData?.counts ?? {});
  }, [isGrouped, isGroupDataStale, isGroupLoading, groupData?.counts]);

  const groupCounts = groupData?.counts;
  const groupSortValues = groupData?.sortValues;

  // ============================================================================
  // Internal SubGroup Fetching (board-specific)
  // ============================================================================

  const isSubGrouped = Boolean(subGroup);

  // Extract only structural config (without sort/hideEmpty) for subGroup query
  const subGroupByConfig = useMemo(
    () => getGroupByConfig(subGroup),
    [subGroup]
  );

  // Build subGroup query options using only structural config
  const subGroupQueryOptions = useMemo(() => {
    if (!(subGroupByConfig && subGroupQueryOptionsFactory)) {
      return {
        queryKey: ["__subgroup_disabled__"] as const,
        queryFn: () => Promise.resolve(null),
        enabled: false,
      };
    }
    const factoryOptions = subGroupQueryOptionsFactory(subGroupByConfig);
    return {
      ...factoryOptions,
      queryKey: factoryOptions.queryKey,
      queryFn: factoryOptions.queryFn as () => Promise<unknown>,
      enabled: true,
    };
  }, [subGroupByConfig, subGroupQueryOptionsFactory]);

  const {
    data: rawSubGroupData,
    isFetching: isSubGroupFetching,
    isLoading: isSubGroupLoading,
  } = useQuery(subGroupQueryOptions);

  // Cast to proper type (same shape as group query response)
  const subGroupData = rawSubGroupData as GroupQueryResponse | null | undefined;

  // Track which subGroup STRUCTURE the data corresponds to (stale data fix)
  const subGroupStructuralKey = useMemo(
    () => getGroupStructuralKey(subGroup),
    [subGroup]
  );
  const [
    lastFetchedSubGroupStructuralKey,
    setLastFetchedSubGroupStructuralKey,
  ] = useState<string | null>(() => getGroupStructuralKey(subGroup));

  useEffect(() => {
    if (!isSubGroupFetching && subGroupData) {
      setLastFetchedSubGroupStructuralKey(subGroupStructuralKey);
    }
  }, [isSubGroupFetching, subGroupData, subGroupStructuralKey]);

  // Data is stale only when subGroup STRUCTURE changed (property/type, not sorting)
  const isSubGroupDataStale =
    isSubGrouped &&
    lastFetchedSubGroupStructuralKey !== null &&
    lastFetchedSubGroupStructuralKey !== subGroupStructuralKey;

  // Compute subGroupKeys from internal data
  const subGroupKeys = useMemo(() => {
    if (!isSubGrouped) {
      return undefined; // No subGroup
    }
    if (isSubGroupDataStale || isSubGroupLoading) {
      return []; // Loading/stale - show empty
    }
    return Object.keys(subGroupData?.counts ?? {});
  }, [
    isSubGrouped,
    isSubGroupDataStale,
    isSubGroupLoading,
    subGroupData?.counts,
  ]);

  const subGroupCounts = subGroupData?.counts;
  const subGroupSortValues = subGroupData?.sortValues;

  // ============================================================================
  // Expanded State
  // ============================================================================

  // For boards with subGroup, expanded refers to subGroup keys
  // For other views, expanded refers to group keys
  const expandedKeys = isSubGrouped ? (subGroupKeys ?? []) : groupKeys;

  // Compute initial expanded value
  const getInitialExpanded = useCallback(() => {
    if (urlExpanded && urlExpanded.length > 0) {
      return urlExpanded;
    }
    if (defaultExpanded && defaultExpanded.length > 0) {
      return defaultExpanded;
    }
    // Flat mode (not grouped) - always expand to show data
    if (expandedKeys.length === 1 && expandedKeys[0] === "__ungrouped__") {
      return ["__ungrouped__"];
    }
    // Grouped/subGrouped mode - expand first few by default
    if (isSubGrouped && expandedKeys.length > 0) {
      return expandedKeys.slice(0, 3); // Auto-expand first 3 subGroups
    }
    // Grouped mode - collapse all by default
    return [];
  }, [urlExpanded, defaultExpanded, expandedKeys, isSubGrouped]);

  // Local state for immediate UI updates
  const [localExpanded, setLocalExpanded] =
    useState<string[]>(getInitialExpanded);

  // Track expandedKeys (group or subGroup depending on view type)
  const prevExpandedKeysRef = useRef(expandedKeys);

  // Sync from URL when it changes externally
  useEffect(() => {
    if (!isInternalChange.current) {
      setLocalExpanded(getInitialExpanded());
    }
    isInternalChange.current = false;
  }, [urlExpanded, getInitialExpanded]);

  // Handle expandedKeys changes (e.g., switching between flat/grouped mode or subGroup changes)
  useEffect(() => {
    const prevKeys = prevExpandedKeysRef.current;
    const keysChanged =
      prevKeys.length !== expandedKeys.length ||
      prevKeys.some((k, i) => k !== expandedKeys[i]);

    if (keysChanged) {
      prevExpandedKeysRef.current = expandedKeys;
      setLocalExpanded(getInitialExpanded());
    }
  }, [expandedKeys, getInitialExpanded]);

  // ============================================================================
  // Setters
  // ============================================================================

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

  const setExpandedGroups = useCallback(
    (groups: string[]) => {
      setLocalExpanded(groups);
      isInternalChange.current = true;
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
        setUrlExpanded(null);
        setUrlCursors(null);
      });
    },
    [setUrlGroup, setUrlExpanded, setUrlCursors]
  );

  const setSubGroup = useCallback(
    (newSubGroup: GroupConfigInput | null) => {
      startTransition(() => {
        setUrlSubGroup(newSubGroup);
      });
    },
    [setUrlSubGroup]
  );

  // ============================================================================
  // Query Results State
  // ============================================================================

  const [queryResults, setQueryResults] = useState<
    Map<string, StoredPageQueryResult<TData>>
  >(() => new Map());

  const handleQueryResult = useCallback(
    (groupKey: string, result: StoredPageQueryResult<TData>) => {
      setQueryResults((prev) => {
        const existing = prev.get(groupKey);

        if (
          existing &&
          existing.data === result.data &&
          existing.isFetching === result.isFetching &&
          existing.isPending === result.isPending &&
          existing.isPlaceholderData === result.isPlaceholderData &&
          existing.hasNext === result.hasNext &&
          existing.hasPrev === result.hasPrev &&
          existing.displayStart === result.displayStart &&
          existing.displayEnd === result.displayEnd
        ) {
          return prev;
        }

        const next = new Map(prev);
        next.set(groupKey, result);
        return next;
      });
    },
    []
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
      limit,
      search,
      sort,
      subGroup,
      setCursor,
      setExpandedGroups,
      setFilter,
      setGroup,
      setLimit,
      setSearch,
      setSort,
      setSubGroup,
      groupCounts,
      groupKeys,
      groupSortValues,
      subGroupCounts,
      subGroupKeys,
      subGroupSortValues,
      queryOptionsFactory: queryOptionsFactory as (params: unknown) => unknown,
      isPending,
      type: "page",
    }),
    [
      cursors,
      localExpanded,
      filter,
      group,
      limit,
      search,
      sort,
      subGroup,
      setCursor,
      setExpandedGroups,
      setFilter,
      setGroup,
      setLimit,
      setSearch,
      setSort,
      setSubGroup,
      groupCounts,
      groupKeys,
      groupSortValues,
      subGroupCounts,
      subGroupKeys,
      subGroupSortValues,
      queryOptionsFactory,
      isPending,
    ]
  );

  // ============================================================================
  // Build Output
  // ============================================================================

  const groups = groupKeys.map((key) => {
    const q = queryResults.get(key);
    const countInfo = groupCounts?.[key];
    return {
      key,
      items: (q?.data ?? []) as TData[],
      isLoading: q?.isPending ?? true,
      isFetching: q?.isFetching ?? true,
      hasNext: q?.hasNext ?? false,
      hasPrev: q?.hasPrev ?? false,
      onNext: q?.onNext ?? noop,
      onPrev: q?.onPrev ?? noop,
      displayStart: q?.displayStart ?? 0,
      displayEnd: q?.displayEnd ?? 0,
      count: countInfo?.count,
      displayCount: countInfo?.hasMore ? "99+" : undefined,
    };
  });

  const results = Array.from(queryResults.values());
  const data = groups.flatMap((g) => g.items);
  const pagination: PagePaginationState<TData> = {
    groups,
    isLoading:
      isGroupLoading ||
      isGroupDataStale ||
      results.length === 0 ||
      results.some((q) => q.isFetching),
    limit,
    onLimitChange: results[0]?.onLimitChange ?? noop,
  };

  // For grouped views, isEmpty means no groups exist (not just no data loaded)
  // For flat views, isEmpty means no data items
  const isFlat = groupKeys.length === 1 && groupKeys[0] === "__ungrouped__";
  const isEmpty = isFlat ? data.length === 0 : groupKeys.length === 0;
  const isLoading =
    isGroupLoading ||
    isGroupDataStale ||
    // Include subGroup loading state for boards (when subGroup is configured)
    (isSubGrouped && (isSubGroupLoading || isSubGroupDataStale)) ||
    queryResults.size === 0 ||
    queryResults.size < groupKeys.length ||
    results.some((q) => q.isFetching);
  // Only consider isPlaceholderData from expanded groups
  // Non-expanded groups have disabled queries that show cached data as placeholder forever
  const isPlaceholderData = localExpanded.some((key) => {
    const result = queryResults.get(key);
    return result?.isPlaceholderData ?? false;
  });

  const mergedCounts: ViewCounts = useMemo(
    () => ({
      group: groupCounts ?? {},
      groupSortValues: groupSortValues ?? {},
      // Include subGroup counts if available (from QueryBridge)
      ...(subGroupCounts ? { subGroup: subGroupCounts } : {}),
      ...(subGroupSortValues ? { subGroupSortValues } : {}),
      ...viewProps.counts,
    }),
    [
      groupCounts,
      groupSortValues,
      subGroupCounts,
      subGroupSortValues,
      viewProps.counts,
    ]
  );

  return (
    <PaginationStateProvider
      isEmpty={isEmpty}
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
    >
      <QueryControllerContext.Provider value={runtimeState}>
        {groupKeys.map((key) => (
          <PageGroupQueryExecutor<TData>
            groupKey={key}
            key={key}
            onResult={handleQueryResult}
          />
        ))}
      </QueryControllerContext.Provider>
      <DataViewProviderCore<TData, TProperties>
        {...(viewProps as DataViewProviderProps<TData, TProperties>)}
        counts={mergedCounts}
        data={data}
        expandedGroups={localExpanded}
        filter={filter}
        group={group}
        onExpandedGroupsChange={setExpandedGroups}
        pagination={pagination}
        search={search}
        sort={sort}
        subGroup={subGroup}
      >
        {children}
      </DataViewProviderCore>
    </PaginationStateProvider>
  );
}

interface PageGroupQueryExecutorProps<TData> {
  groupKey: string;
  onResult: (groupKey: string, result: StoredPageQueryResult<TData>) => void;
}

function PageGroupQueryExecutor<TData>({
  groupKey,
  onResult,
}: PageGroupQueryExecutorProps<TData>) {
  const { useGroupQuery } = require("../../hooks/use-group-query");
  const result = useGroupQuery({ groupKey });

  useEffect(() => {
    onResult(groupKey, {
      data: result.data,
      isFetching: result.isFetching,
      isPending: result.isPending,
      isPlaceholderData: result.isPlaceholderData,
      hasNext: result.hasNext,
      hasPrev: result.hasPrev,
      displayStart: result.displayStart,
      displayEnd: result.displayEnd,
      onNext: result.onNext,
      onPrev: result.onPrev,
      onLimitChange: result.onLimitChange,
    });
  }, [
    groupKey,
    onResult,
    result.data,
    result.isFetching,
    result.isPending,
    result.isPlaceholderData,
    result.hasNext,
    result.hasPrev,
    result.displayStart,
    result.displayEnd,
    result.onNext,
    result.onPrev,
    result.onLimitChange,
  ]);

  return null;
}

// ============================================================================
// Infinite Query Bridge
// ============================================================================

interface StoredInfiniteQueryResult<TData> {
  data: TData[];
  error: Error | null;
  hasNextPage: boolean | Record<string, boolean>;
  isError: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isPending: boolean;
  isPlaceholderData: boolean;
  onLimitChange: (limit: Limit) => void;
  onLoadMore: () => void;
  totalLoaded: number;
}

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
    counts?: Partial<ViewCounts>;
  };
}

/**
 * InfiniteQueryBridge - Orchestrates infinite query execution and data aggregation.
 *
 * Owns nuqs hooks for URL state management internally, keeping re-renders
 * scoped to this component and its children only.
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
    groupQueryOptionsFactory,
    queryOptionsFactory,
    subGroupQueryOptionsFactory,
  } = controller;

  // Defaults from provider props
  const {
    expanded: defaultExpanded,
    filter: defaultFilter = null,
    group: defaultGroup = null,
    limit: defaultLimit = 10,
    search: defaultSearch = "",
    sort: defaultSort = [],
    subGroup: defaultSubGroup = null,
  } = defaults ?? {};

  const [isPending, startTransition] = useTransition();

  const isInternalChange = useRef(false);

  // ============================================================================
  // URL State via nuqs
  // ============================================================================

  const [urlExpanded, setUrlExpanded] = useQueryState(
    "expanded",
    parseAsExpanded.withOptions({ throttleMs: THROTTLE_MS })
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
  const [urlSubGroup, setUrlSubGroup] = useQueryState(
    "subGroup",
    parseAsGroupBy.withOptions({ throttleMs: THROTTLE_MS })
  );

  // ============================================================================
  // Current Values (URL ?? defaults)
  // ============================================================================

  const filter = urlFilter ?? defaultFilter;
  const sort = urlSort ?? defaultSort;
  const search = urlSearch ?? defaultSearch;
  const group = urlGroup ?? defaultGroup;
  const subGroup = urlSubGroup ?? defaultSubGroup;
  const limit = (urlLimit ?? defaultLimit) as Limit;

  // ============================================================================
  // Internal Group Fetching
  // ============================================================================

  const isGrouped = Boolean(group);

  // Extract only structural config (without sort/hideEmpty) for query
  const groupByConfig = useMemo(() => getGroupByConfig(group), [group]);

  // Build group query options using only structural config
  const groupQueryOptions = useMemo(() => {
    if (!(groupByConfig && groupQueryOptionsFactory)) {
      return {
        queryKey: ["__disabled__"] as const,
        queryFn: () => Promise.resolve(null),
        enabled: false,
      };
    }
    const factoryOptions = groupQueryOptionsFactory(groupByConfig);
    return {
      ...factoryOptions,
      queryKey: factoryOptions.queryKey,
      queryFn: factoryOptions.queryFn as () => Promise<unknown>,
      enabled: true,
    };
  }, [groupByConfig, groupQueryOptionsFactory]);

  // Type for group query response
  interface GroupQueryResponse {
    counts?: Record<string, { count: number; hasMore: boolean }>;
    sortValues?: Record<string, string | number>;
  }

  const {
    data: rawGroupData,
    isFetching: isGroupFetching,
    isLoading: isGroupLoading,
  } = useQuery(groupQueryOptions);

  // Cast to proper type
  const groupData = rawGroupData as GroupQueryResponse | null | undefined;

  // Track which group STRUCTURE the data corresponds to (stale data fix)
  // Only the group type + property matter - sorting/showCount don't affect which groups exist
  const groupStructuralKey = useMemo(
    () => getGroupStructuralKey(group),
    [group]
  );
  const [lastFetchedStructuralKey, setLastFetchedStructuralKey] = useState<
    string | null
  >(() => getGroupStructuralKey(group));

  useEffect(() => {
    if (!isGroupFetching && groupData) {
      setLastFetchedStructuralKey(groupStructuralKey);
    }
  }, [isGroupFetching, groupData, groupStructuralKey]);

  // Data is stale only when group STRUCTURE changed (property/type, not sorting)
  const isGroupDataStale =
    isGrouped &&
    lastFetchedStructuralKey !== null &&
    lastFetchedStructuralKey !== groupStructuralKey;

  // Compute groupKeys from internal data
  const groupKeys = useMemo(() => {
    if (!isGrouped) {
      return ["__ungrouped__"]; // Flat mode
    }
    if (isGroupDataStale || isGroupLoading) {
      return []; // Loading/stale - show empty
    }
    return Object.keys(groupData?.counts ?? {});
  }, [isGrouped, isGroupDataStale, isGroupLoading, groupData?.counts]);

  const groupCounts = groupData?.counts;
  const groupSortValues = groupData?.sortValues;

  // ============================================================================
  // Internal SubGroup Fetching (board-specific)
  // ============================================================================

  const isSubGrouped = Boolean(subGroup);

  // Extract only structural config (without sort/hideEmpty) for subGroup query
  const subGroupByConfig = useMemo(
    () => getGroupByConfig(subGroup),
    [subGroup]
  );

  // Build subGroup query options using only structural config
  const subGroupQueryOptions = useMemo(() => {
    if (!(subGroupByConfig && subGroupQueryOptionsFactory)) {
      return {
        queryKey: ["__subgroup_disabled__"] as const,
        queryFn: () => Promise.resolve(null),
        enabled: false,
      };
    }
    const factoryOptions = subGroupQueryOptionsFactory(subGroupByConfig);
    return {
      ...factoryOptions,
      queryKey: factoryOptions.queryKey,
      queryFn: factoryOptions.queryFn as () => Promise<unknown>,
      enabled: true,
    };
  }, [subGroupByConfig, subGroupQueryOptionsFactory]);

  const {
    data: rawSubGroupData,
    isFetching: isSubGroupFetching,
    isLoading: isSubGroupLoading,
  } = useQuery(subGroupQueryOptions);

  // Cast to proper type (same shape as group query response)
  const subGroupData = rawSubGroupData as GroupQueryResponse | null | undefined;

  // Track which subGroup STRUCTURE the data corresponds to (stale data fix)
  const subGroupStructuralKey = useMemo(
    () => getGroupStructuralKey(subGroup),
    [subGroup]
  );
  const [
    lastFetchedSubGroupStructuralKey,
    setLastFetchedSubGroupStructuralKey,
  ] = useState<string | null>(() => getGroupStructuralKey(subGroup));

  useEffect(() => {
    if (!isSubGroupFetching && subGroupData) {
      setLastFetchedSubGroupStructuralKey(subGroupStructuralKey);
    }
  }, [isSubGroupFetching, subGroupData, subGroupStructuralKey]);

  // Data is stale only when subGroup STRUCTURE changed (property/type, not sorting)
  const isSubGroupDataStale =
    isSubGrouped &&
    lastFetchedSubGroupStructuralKey !== null &&
    lastFetchedSubGroupStructuralKey !== subGroupStructuralKey;

  // Compute subGroupKeys from internal data
  const subGroupKeys = useMemo(() => {
    if (!isSubGrouped) {
      return undefined; // No subGroup
    }
    if (isSubGroupDataStale || isSubGroupLoading) {
      return []; // Loading/stale - show empty
    }
    return Object.keys(subGroupData?.counts ?? {});
  }, [
    isSubGrouped,
    isSubGroupDataStale,
    isSubGroupLoading,
    subGroupData?.counts,
  ]);

  const subGroupCounts = subGroupData?.counts;
  const subGroupSortValues = subGroupData?.sortValues;

  // ============================================================================
  // Expanded State
  // ============================================================================

  // For boards with subGroup, expanded refers to subGroup keys
  // For other views, expanded refers to group keys
  const expandedKeys = isSubGrouped ? (subGroupKeys ?? []) : groupKeys;

  const getInitialExpanded = useCallback(() => {
    if (urlExpanded && urlExpanded.length > 0) {
      return urlExpanded;
    }
    if (defaultExpanded && defaultExpanded.length > 0) {
      return defaultExpanded;
    }
    // Flat mode (not grouped) - always expand to show data
    if (expandedKeys.length === 1 && expandedKeys[0] === "__ungrouped__") {
      return ["__ungrouped__"];
    }
    // Grouped/subGrouped mode - expand first few by default
    if (isSubGrouped && expandedKeys.length > 0) {
      return expandedKeys.slice(0, 3); // Auto-expand first 3 subGroups
    }
    // Grouped mode - collapse all by default
    return [];
  }, [urlExpanded, defaultExpanded, expandedKeys, isSubGrouped]);

  const [localExpanded, setLocalExpanded] =
    useState<string[]>(getInitialExpanded);

  // Track expandedKeys (group or subGroup depending on view type)
  const prevExpandedKeysRef = useRef(expandedKeys);

  useEffect(() => {
    if (!isInternalChange.current) {
      setLocalExpanded(getInitialExpanded());
    }
    isInternalChange.current = false;
  }, [urlExpanded, getInitialExpanded]);

  useEffect(() => {
    const prevKeys = prevExpandedKeysRef.current;
    const keysChanged =
      prevKeys.length !== expandedKeys.length ||
      prevKeys.some((k, i) => k !== expandedKeys[i]);

    if (keysChanged) {
      prevExpandedKeysRef.current = expandedKeys;
      setLocalExpanded(getInitialExpanded());
    }
  }, [expandedKeys, getInitialExpanded]);

  // ============================================================================
  // Setters
  // ============================================================================

  const setExpandedGroups = useCallback(
    (groups: string[]) => {
      setLocalExpanded(groups);
      isInternalChange.current = true;
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
        setUrlExpanded(null);
      });
    },
    [setUrlGroup, setUrlExpanded]
  );

  const setSubGroup = useCallback(
    (newSubGroup: GroupConfigInput | null) => {
      startTransition(() => {
        setUrlSubGroup(newSubGroup);
      });
    },
    [setUrlSubGroup]
  );

  // ============================================================================
  // Query Results State
  // ============================================================================

  const [queryResults, setQueryResults] = useState<
    Map<string, StoredInfiniteQueryResult<TData>>
  >(() => new Map());

  const handleQueryResult = useCallback(
    (groupKey: string, result: StoredInfiniteQueryResult<TData>) => {
      setQueryResults((prev) => {
        const existing = prev.get(groupKey);

        if (
          existing &&
          existing.data === result.data &&
          existing.isFetching === result.isFetching &&
          existing.isPending === result.isPending &&
          existing.isPlaceholderData === result.isPlaceholderData &&
          existing.hasNextPage === result.hasNextPage &&
          existing.isFetchingNextPage === result.isFetchingNextPage &&
          existing.totalLoaded === result.totalLoaded
        ) {
          return prev;
        }

        const next = new Map(prev);
        next.set(groupKey, result);
        return next;
      });
    },
    []
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
      limit,
      search,
      sort,
      subGroup,
      setCursor: noopSetCursor,
      setExpandedGroups,
      setFilter,
      setGroup,
      setLimit,
      setSearch,
      setSort,
      setSubGroup,
      groupCounts,
      groupKeys,
      groupSortValues,
      subGroupCounts,
      subGroupKeys,
      subGroupSortValues,
      queryOptionsFactory: queryOptionsFactory as (params: unknown) => unknown,
      isPending,
      type: "infinite",
    }),
    [
      localExpanded,
      filter,
      group,
      limit,
      search,
      sort,
      subGroup,
      setExpandedGroups,
      setFilter,
      setGroup,
      setLimit,
      setSearch,
      setSort,
      setSubGroup,
      groupCounts,
      groupKeys,
      groupSortValues,
      subGroupCounts,
      subGroupKeys,
      subGroupSortValues,
      queryOptionsFactory,
      isPending,
    ]
  );

  // ============================================================================
  // Build Output
  // ============================================================================

  const groups = groupKeys.map((key) => {
    const q = queryResults.get(key);
    const countInfo = groupCounts?.[key];
    const items = q?.data ?? [];

    return {
      key,
      items,
      isLoading: q?.isPending ?? true,
      isError: q?.isError ?? false,
      isFetching: q?.isFetching ?? true,
      isFetchingNextPage: q?.isFetchingNextPage ?? false,
      hasNext: q?.hasNextPage ?? false,
      onNext: q?.onLoadMore ?? noop,
      totalLoaded: items.length,
      error: q?.error ?? null,
      count: countInfo?.count,
      displayCount: countInfo?.hasMore ? "99+" : undefined,
    };
  });

  const results = Array.from(queryResults.values());
  const data = groups.flatMap((g) => g.items);
  const pagination: InfinitePaginationState<TData> = {
    groups,
    isLoading:
      isGroupLoading ||
      isGroupDataStale ||
      results.length === 0 ||
      results.some((q) => q.isFetching),
    limit,
    onLimitChange: results[0]?.onLimitChange ?? noop,
  };

  // For grouped views, isEmpty means no groups exist (not just no data loaded)
  // For flat views, isEmpty means no data items
  const isFlat = groupKeys.length === 1 && groupKeys[0] === "__ungrouped__";
  const isEmpty = isFlat ? data.length === 0 : groupKeys.length === 0;
  const isLoading =
    isGroupLoading ||
    isGroupDataStale ||
    // Include subGroup loading state for boards (when subGroup is configured)
    (isSubGrouped && (isSubGroupLoading || isSubGroupDataStale)) ||
    queryResults.size === 0 ||
    queryResults.size < groupKeys.length ||
    results.some((q) => q.isFetching);
  // Only consider isPlaceholderData from expanded groups
  // Non-expanded groups have disabled queries that show cached data as placeholder forever
  const isPlaceholderData = localExpanded.some((key) => {
    const result = queryResults.get(key);
    return result?.isPlaceholderData ?? false;
  });

  const mergedCounts: ViewCounts = useMemo(
    () => ({
      group: groupCounts ?? {},
      groupSortValues: groupSortValues ?? {},
      // Include subGroup counts if available (from QueryBridge)
      ...(subGroupCounts ? { subGroup: subGroupCounts } : {}),
      ...(subGroupSortValues ? { subGroupSortValues } : {}),
      ...viewProps.counts,
    }),
    [
      groupCounts,
      groupSortValues,
      subGroupCounts,
      subGroupSortValues,
      viewProps.counts,
    ]
  );

  return (
    <PaginationStateProvider
      isEmpty={isEmpty}
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
    >
      <QueryControllerContext.Provider value={runtimeState}>
        {groupKeys.map((key) => (
          <InfiniteGroupQueryExecutor<TData>
            groupKey={key}
            key={key}
            onResult={handleQueryResult}
          />
        ))}
      </QueryControllerContext.Provider>
      <DataViewProviderCore<TData, TProperties>
        {...(viewProps as DataViewProviderProps<TData, TProperties>)}
        counts={mergedCounts}
        data={data}
        expandedGroups={localExpanded}
        filter={filter}
        group={group}
        onExpandedGroupsChange={setExpandedGroups}
        pagination={pagination}
        search={search}
        sort={sort}
        subGroup={subGroup}
      >
        {children}
      </DataViewProviderCore>
    </PaginationStateProvider>
  );
}

interface InfiniteGroupQueryExecutorProps<TData> {
  groupKey: string;
  onResult: (
    groupKey: string,
    result: StoredInfiniteQueryResult<TData>
  ) => void;
}

function InfiniteGroupQueryExecutor<TData>({
  groupKey,
  onResult,
}: InfiniteGroupQueryExecutorProps<TData>) {
  const {
    useInfiniteGroupQuery,
  } = require("../../hooks/use-infinite-group-query");
  const result = useInfiniteGroupQuery({ groupKey });

  useEffect(() => {
    onResult(groupKey, {
      data: result.data,
      isFetching: result.isFetching,
      isPending: result.isPending,
      isPlaceholderData: result.isPlaceholderData,
      hasNextPage: result.hasNextPage,
      isFetchingNextPage: result.isFetchingNextPage,
      isError: result.isError,
      error: result.error,
      totalLoaded: result.totalLoaded,
      onLoadMore: result.onLoadMore,
      onLimitChange: result.onLimitChange,
    });
  }, [
    groupKey,
    onResult,
    result.data,
    result.isFetching,
    result.isPending,
    result.isPlaceholderData,
    result.hasNextPage,
    result.isFetchingNextPage,
    result.isError,
    result.error,
    result.totalLoaded,
    result.onLoadMore,
    result.onLimitChange,
  ]);

  return null;
}
