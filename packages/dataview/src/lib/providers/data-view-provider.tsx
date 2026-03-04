"use client";

import type { Limit, SortQuery, WhereNode } from "@sparkyidea/shared/types";
import {
  Children,
  isValidElement,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import {
  type ColumnConfig,
  type DataViewProperty,
  type GroupConfig,
  type GroupCounts,
  type InfinitePaginationController,
  type PagePaginationController,
  toPropertyMetaArray,
  type ViewCounts,
} from "../../types";
import { cn } from "../utils";
import {
  DataViewContext,
  type DataViewContextValue,
  type PaginationOutput,
} from "./data-view-context";
import { InfiniteQueryBridge, PageQueryBridge } from "./query-bridge";
import { ToolbarContextProvider } from "./toolbar-context";

// ============================================================================
// Child Slot Splitting
// ============================================================================

/** Static marker for toolbar components */
export const TOOLBAR_SLOT = "toolbar" as const;

/**
 * Component type with optional dataViewSlot marker.
 */
interface SlottedComponent {
  dataViewSlot?: typeof TOOLBAR_SLOT;
}

/**
 * Split children into toolbar and content groups.
 * Toolbar children are identified by the static `dataViewSlot = "toolbar"` marker.
 */
function splitChildren(children: ReactNode): {
  toolbarChildren: ReactNode[];
  contentChildren: ReactNode[];
} {
  const toolbarChildren: ReactNode[] = [];
  const contentChildren: ReactNode[] = [];

  for (const child of Children.toArray(children)) {
    if (isValidElement(child)) {
      const type = child.type as SlottedComponent;
      if (type.dataViewSlot === TOOLBAR_SLOT) {
        toolbarChildren.push(child);
        continue;
      }
    }
    contentChildren.push(child);
  }

  return { toolbarChildren, contentChildren };
}

// ============================================================================
// Defaults Config
// ============================================================================

/**
 * URL defaults configuration.
 * These values are used when the URL has no corresponding parameter.
 */
export interface DefaultsConfig {
  /** Default column config for board (includes view options like showCount) */
  column?: ColumnConfig | null;
  /** Default expanded groups */
  expanded?: string[];
  /** Default filter */
  filter?: WhereNode[] | null;
  /** Default group config (includes view options like showCount) */
  group?: GroupConfig | null;
  /** Default page size @default 10 */
  limit?: Limit;
  /** Default search */
  search?: string;
  /** Default sort */
  sort?: SortQuery[];
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if pagination prop is a PagePaginationController.
 */
function isPageController<TQueryOptions>(
  // biome-ignore lint/suspicious/noExplicitAny: Generic union type
  pagination: any
): pagination is PagePaginationController<TQueryOptions> {
  return pagination && pagination.type === "page";
}

/**
 * Check if pagination prop is an InfinitePaginationController.
 */
function isInfiniteController<TQueryOptions>(
  // biome-ignore lint/suspicious/noExplicitAny: Generic union type
  pagination: any
): pagination is InfinitePaginationController<TQueryOptions> {
  return pagination && pagination.type === "infinite";
}

// ============================================================================
// Props
// ============================================================================

/**
 * Props when using direct data (no pagination controller).
 */
interface DirectDataProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  children: ReactNode;
  className?: string;
  column?: ColumnConfig | null;
  columnCounts?: GroupCounts;
  counts?: ViewCounts;
  data: TData[];
  expandedGroups?: string[];
  filter?: WhereNode[] | null;
  group?: GroupConfig | null;
  /** Keys for all groups (from server group counts query) */
  groupKeys?: string[];
  limit?: number;
  onColumnChange?: (column: ColumnConfig | null) => void;
  onExpandedGroupsChange?: (groups: string[]) => void;
  pagination?: PaginationOutput<TData>;
  properties: TProperties;
  propertyVisibility?: TProperties[number]["id"][];
  search?: string;
  sort?: SortQuery[];
}

/**
 * Props when using a pagination controller.
 * Data, filter, sort, search, expandedGroups are managed by the controller.
 */
interface ControllerProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
  TQueryOptions,
> {
  children: ReactNode;
  className?: string;
  /** Column counts - passed directly for board views */
  columnCounts?: GroupCounts;
  counts?: Partial<ViewCounts>;
  /** URL defaults - values used when URL has no corresponding parameter */
  defaults?: DefaultsConfig;
  pagination:
    | PagePaginationController<TQueryOptions>
    | InfinitePaginationController<TQueryOptions>;
  properties: TProperties;
  propertyVisibility?: TProperties[number]["id"][];
}

export type DataViewProviderProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
  // biome-ignore lint/suspicious/noExplicitAny: Controller is generic
  TQueryOptions = any,
> =
  | DirectDataProps<TData, TProperties>
  | ControllerProps<TData, TProperties, TQueryOptions>;

// ============================================================================
// Component
// ============================================================================

export function DataViewProvider<
  TData = unknown,
  TProperties extends
    readonly DataViewProperty<TData>[] = readonly DataViewProperty<TData>[],
  // biome-ignore lint/suspicious/noExplicitAny: Controller is generic
  TQueryOptions = any,
>(props: DataViewProviderProps<TData, TProperties, TQueryOptions>) {
  const { children, className, pagination, properties } = props;

  // Split children into toolbar (non-suspending) and content (may suspend)
  const { toolbarChildren, contentChildren } = splitChildren(children);

  // Convert properties to PropertyMeta array for ToolbarContextProvider
  const propertyMetas = toPropertyMetaArray(properties);

  // Route to QueryBridge if pagination is a controller
  if (isPageController(pagination)) {
    const controllerProps = props as ControllerProps<
      TData,
      TProperties,
      TQueryOptions
    >;
    const viewProps = {
      className,
      columnCounts: controllerProps.columnCounts,
      counts: controllerProps.counts,
      properties,
      propertyVisibility: controllerProps.propertyVisibility,
    };

    return (
      <ToolbarContextProvider
        group={controllerProps.defaults?.group}
        properties={propertyMetas}
      >
        {toolbarChildren}
        <PageQueryBridge<TData, TProperties, TQueryOptions>
          controller={pagination}
          defaults={controllerProps.defaults}
          viewProps={viewProps}
        >
          {contentChildren}
        </PageQueryBridge>
      </ToolbarContextProvider>
    );
  }

  if (isInfiniteController(pagination)) {
    const controllerProps = props as ControllerProps<
      TData,
      TProperties,
      TQueryOptions
    >;
    const viewProps = {
      className,
      columnCounts: controllerProps.columnCounts,
      counts: controllerProps.counts,
      properties,
      propertyVisibility: controllerProps.propertyVisibility,
    };

    return (
      <ToolbarContextProvider
        group={controllerProps.defaults?.group}
        properties={propertyMetas}
      >
        {toolbarChildren}
        <InfiniteQueryBridge<TData, TProperties, TQueryOptions>
          controller={pagination}
          defaults={controllerProps.defaults}
          viewProps={viewProps}
        >
          {contentChildren}
        </InfiniteQueryBridge>
      </ToolbarContextProvider>
    );
  }

  // Direct data path (backwards compatible)
  const directProps = props as DirectDataProps<TData, TProperties>;

  return (
    <ToolbarContextProvider
      group={directProps.group}
      properties={propertyMetas}
    >
      {toolbarChildren}
      <DataViewProviderCore<TData, TProperties>
        {...directProps}
        className={className}
      >
        {contentChildren}
      </DataViewProviderCore>
    </ToolbarContextProvider>
  );
}

// ============================================================================
// Core Provider (Internal)
// ============================================================================

/**
 * DataViewProviderCore - The actual provider implementation.
 * Used directly by QueryBridge and for direct data usage.
 */
export function DataViewProviderCore<
  TData = unknown,
  TProperties extends
    readonly DataViewProperty<TData>[] = readonly DataViewProperty<TData>[],
>({
  children,
  className,
  column,
  columnCounts,
  counts,
  data,
  expandedGroups,
  filter,
  group,
  groupKeys,
  limit,
  onColumnChange,
  onExpandedGroupsChange,
  pagination,
  properties,
  propertyVisibility: propertyVisibilityProp,
  search,
  sort,
}: DirectDataProps<TData, TProperties>) {
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
      limit,
      onColumnChange,
      onExpandedGroupsChange,
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
      limit,
      onColumnChange,
      onExpandedGroupsChange,
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
      <div className={cn("flex flex-col gap-2", className)}>{children}</div>
    </DataViewContext.Provider>
  );
}

// Re-export PaginationOutput for backward compatibility
export type { PaginationOutput } from "./data-view-context";
