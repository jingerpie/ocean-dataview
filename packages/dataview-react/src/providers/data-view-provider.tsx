"use client";

import type {
  ColumnConfigInput,
  GroupConfigInput,
  GroupCounts,
  InfiniteController,
  Limit,
  PageController,
  SortQuery,
  ViewCounts,
  WhereNode,
} from "@sparkyidea/dataview-core";
import {
  type DataViewProperty,
  normalizeProperties,
  toPropertyMetaArray,
} from "@sparkyidea/dataview-core";
import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  DataViewContext,
  type DataViewContextValue,
  type PaginationOutput,
} from "./data-view-context";
import type { DataViewStateAdapter } from "./data-view-state";
import { InfiniteQueryBridge, PageQueryBridge } from "./query-bridge";
import { QueryParamsProvider } from "./query-params-context";
import { ToolbarContextProvider } from "./toolbar-context";

// ============================================================================
// Defaults Config
// ============================================================================

/**
 * URL defaults configuration.
 * These values are used when the URL has no corresponding parameter.
 */
export interface DefaultsConfig {
  /** Default column config for board (includes view options like showCount) */
  column?: ColumnConfigInput | null;
  /** Default expanded groups */
  expanded?: string[];
  /** Default filter */
  filter?: WhereNode[] | null;
  /** Default group config (includes view options like showCount) */
  group?: GroupConfigInput | null;
  /** Default page size @default 10 */
  limit?: Limit;
  /** Default search */
  search?: string;
  /** Default sort */
  sort?: SortQuery[];
}

/** Page size used when `defaults.limit` is not set. */
export const DEFAULT_LIMIT: Limit = 25;

// ============================================================================
// Setup Context (consumed by DataViewContent)
// ============================================================================

interface DataViewSetupContextValue {
  columnCounts?: GroupCounts;
  // biome-ignore lint/suspicious/noExplicitAny: Controller is generic
  controller: PageController<any> | InfiniteController<any>;
  counts?: Partial<ViewCounts>;
  defaults: DefaultsConfig;
  properties: readonly DataViewProperty<unknown>[];
  propertyVisibility?: string[];
}

const DataViewSetupContext = createContext<
  DataViewSetupContextValue | undefined
>(undefined);

/**
 * Read the provider setup (controller, defaults, properties).
 * Must be used inside DataViewProvider.
 */
export function useDataViewSetup(): DataViewSetupContextValue {
  const value = useContext(DataViewSetupContext);
  if (!value) {
    throw new Error("useDataViewSetup must be used within DataViewProvider");
  }
  return value;
}

// ============================================================================
// Props
// ============================================================================

/**
 * Props for DataViewProvider.
 * Requires a controller for data fetching and URL state management.
 */
export interface DataViewProviderProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
  TQueryOptions,
> {
  children: ReactNode;
  /** Column counts - passed directly for board views */
  columnCounts?: GroupCounts;
  controller: PageController<TQueryOptions> | InfiniteController<TQueryOptions>;
  counts?: Partial<ViewCounts>;
  /** URL defaults - values used when URL has no corresponding parameter */
  defaults?: DefaultsConfig;
  properties: TProperties;
  propertyVisibility?: TProperties[number]["id"][];
  /**
   * Where view state lives. Defaults to in-memory state. Pass
   * `useNuqsDataViewState()` (from `/nuqs`) to keep it in the URL.
   */
  state?: DataViewStateAdapter;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Provides URL state and toolbar state for a data view.
 * Renders no markup. Place toolbars anywhere inside it, and wrap the view in
 * `DataViewContent`, which runs the queries.
 */
export function DataViewProvider<
  TData = unknown,
  TProperties extends
    readonly DataViewProperty<TData>[] = readonly DataViewProperty<TData>[],
  // biome-ignore lint/suspicious/noExplicitAny: Controller is generic
  TQueryOptions = any,
>({
  children,
  columnCounts,
  controller,
  counts,
  defaults,
  properties,
  propertyVisibility,
  state,
}: DataViewProviderProps<TData, TProperties, TQueryOptions>) {
  // Normalize properties: resolve id from key, validate uniqueness
  const normalizedProperties = useMemo(
    () => normalizeProperties(properties) as unknown as TProperties,
    [properties]
  );

  const mergedDefaults = useMemo(
    () => ({ ...defaults, limit: defaults?.limit ?? DEFAULT_LIMIT }),
    [defaults]
  );

  const propertyMetas = useMemo(
    () => toPropertyMetaArray(normalizedProperties),
    [normalizedProperties]
  );

  const setup = useMemo<DataViewSetupContextValue>(
    () => ({
      columnCounts,
      controller,
      counts,
      defaults: mergedDefaults,
      properties: normalizedProperties as readonly DataViewProperty<unknown>[],
      propertyVisibility,
    }),
    [
      columnCounts,
      controller,
      counts,
      mergedDefaults,
      normalizedProperties,
      propertyVisibility,
    ]
  );

  return (
    <QueryParamsProvider
      defaults={mergedDefaults}
      properties={normalizedProperties}
      state={state}
    >
      <ToolbarContextProvider properties={propertyMetas}>
        <DataViewSetupContext.Provider value={setup}>
          {children}
        </DataViewSetupContext.Provider>
      </ToolbarContextProvider>
    </QueryParamsProvider>
  );
}

// ============================================================================
// Content (runs queries)
// ============================================================================

/**
 * Runs the controller queries and provides the resolved data to the view.
 * Suspends while the first page loads; wrap it (or the provider) in Suspense.
 */
export function DataViewContent({ children }: { children: ReactNode }) {
  const {
    columnCounts,
    controller,
    counts,
    defaults,
    properties,
    propertyVisibility,
  } = useDataViewSetup();

  const viewProps = { columnCounts, counts, properties, propertyVisibility };

  if (controller.type === "page") {
    return (
      <PageQueryBridge
        controller={controller}
        defaults={defaults}
        viewProps={viewProps}
      >
        {children}
      </PageQueryBridge>
    );
  }

  return (
    <InfiniteQueryBridge
      controller={controller}
      defaults={defaults}
      viewProps={viewProps}
    >
      {children}
    </InfiniteQueryBridge>
  );
}

// ============================================================================
// Core Provider (Internal - used by QueryBridge)
// ============================================================================

/**
 * Internal props for DataViewProviderCore.
 * Used by QueryBridge to pass resolved data to views.
 */
export interface CoreProviderProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  children: ReactNode;
  column?: ColumnConfigInput | null;
  columnCounts?: GroupCounts;
  counts?: ViewCounts;
  data: TData[];
  expandedGroups?: string[];
  filter?: WhereNode[] | null;
  group?: GroupConfigInput | null;
  /** Keys for all groups (from server group counts query) */
  groupKeys?: string[];
  /** Whether there are more groups to load */
  hasNextGroupPage?: boolean;
  /** Whether currently fetching more groups */
  isFetchingNextGroupPage?: boolean;
  limit?: number;
  onColumnChange?: (column: ColumnConfigInput | null) => void;
  onExpandedGroupsChange?: (groups: string[]) => void;
  /** Callback to load more groups */
  onLoadMoreGroups?: () => void;
  pagination?: PaginationOutput<TData>;
  properties: TProperties;
  propertyVisibility?: TProperties[number]["id"][];
  search?: string;
  sort?: SortQuery[];
}

/**
 * DataViewProviderCore - The actual provider implementation.
 * Used internally by QueryBridge to provide resolved data to views.
 */
export function DataViewProviderCore<
  TData = unknown,
  TProperties extends
    readonly DataViewProperty<TData>[] = readonly DataViewProperty<TData>[],
>({
  children,
  column,
  columnCounts,
  counts,
  data,
  expandedGroups,
  filter,
  group,
  groupKeys,
  hasNextGroupPage,
  isFetchingNextGroupPage,
  limit,
  onColumnChange,
  onExpandedGroupsChange,
  onLoadMoreGroups,
  pagination,
  properties,
  propertyVisibility: propertyVisibilityProp,
  search,
  sort,
}: CoreProviderProps<TData, TProperties>) {
  // Get all property IDs that CAN be visible (hidden !== true in definition)
  const allVisiblePropertyIds = useMemo(
    () =>
      properties
        .filter((p) => p.hidden !== true)
        .map((p) => p.id) as TProperties[number]["id"][],
    [properties]
  );

  // Use prop if provided, otherwise show all
  const propertyVisibility = (propertyVisibilityProp ??
    allVisiblePropertyIds) as TProperties[number]["id"][];

  const [excludedPropertyIds, setExcludedPropertyIds] = useState<
    TProperties[number]["id"][]
  >([]);

  const propertyMetas = useMemo(
    () => toPropertyMetaArray(properties),
    [properties]
  );

  const contextValue = useMemo<DataViewContextValue<TData, TProperties>>(
    () => ({
      column,
      columnCounts,
      counts,
      data,
      excludedPropertyIds,
      expandedGroups,
      filter,
      group,
      groupKeys,
      hasNextGroupPage,
      isFetchingNextGroupPage,
      limit,
      onColumnChange,
      onExpandedGroupsChange,
      onLoadMoreGroups,
      pagination,
      properties,
      propertyMetas,
      propertyVisibility,
      search,
      setExcludedPropertyIds,
      sort,
    }),
    [
      column,
      columnCounts,
      counts,
      data,
      excludedPropertyIds,
      expandedGroups,
      filter,
      group,
      groupKeys,
      hasNextGroupPage,
      isFetchingNextGroupPage,
      limit,
      onColumnChange,
      onExpandedGroupsChange,
      onLoadMoreGroups,
      pagination,
      properties,
      propertyMetas,
      propertyVisibility,
      search,
      sort,
    ]
  );

  return (
    <DataViewContext.Provider value={contextValue}>
      {children}
    </DataViewContext.Provider>
  );
}
