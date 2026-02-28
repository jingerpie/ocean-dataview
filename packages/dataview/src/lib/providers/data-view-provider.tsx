"use client";

import type { Limit, SortQuery, WhereNode } from "@sparkyidea/shared/types";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import {
  type DataViewProperty,
  type GroupConfig,
  type InfinitePaginationController,
  type PagePaginationController,
  type SubGroupConfig,
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

// ============================================================================
// Defaults Config
// ============================================================================

/**
 * URL defaults configuration.
 * These values are used when the URL has no corresponding parameter.
 */
export interface DefaultsConfig {
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
  /** Default subGroup config (includes view options like showCount) */
  subGroup?: SubGroupConfig | null;
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
  counts?: ViewCounts;
  data: TData[];
  expandedGroups?: string[];
  filter?: WhereNode[] | null;
  group?: GroupConfig | null;
  limit?: number;
  onExpandedGroupsChange?: (groups: string[]) => void;
  pagination?: PaginationOutput<TData>;
  properties: TProperties;
  propertyVisibility?: TProperties[number]["id"][];
  search?: string;
  sort?: SortQuery[];
  subGroup?: SubGroupConfig | null;
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

  // Route to QueryBridge if pagination is a controller
  if (isPageController(pagination)) {
    const controllerProps = props as ControllerProps<
      TData,
      TProperties,
      TQueryOptions
    >;
    const viewProps = {
      className,
      counts: controllerProps.counts,
      properties,
      propertyVisibility: controllerProps.propertyVisibility,
    };

    return (
      <PageQueryBridge<TData, TProperties, TQueryOptions>
        controller={pagination}
        defaults={controllerProps.defaults}
        viewProps={viewProps}
      >
        {children}
      </PageQueryBridge>
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
      counts: controllerProps.counts,
      properties,
      propertyVisibility: controllerProps.propertyVisibility,
    };

    return (
      <InfiniteQueryBridge<TData, TProperties, TQueryOptions>
        controller={pagination}
        defaults={controllerProps.defaults}
        viewProps={viewProps}
      >
        {children}
      </InfiniteQueryBridge>
    );
  }

  // Direct data path (backwards compatible)
  const directProps = props as DirectDataProps<TData, TProperties>;

  return (
    <DataViewProviderCore<TData, TProperties>
      {...directProps}
      className={className}
    >
      {children}
    </DataViewProviderCore>
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
  data,
  properties,
  children,
  className,
  pagination,
  counts,
  expandedGroups,
  onExpandedGroupsChange,
  filter,
  sort,
  search,
  limit,
  group,
  subGroup,
  propertyVisibility: defaultVisibility,
}: DirectDataProps<TData, TProperties>) {
  // Get all property IDs that CAN be visible (hidden !== true in definition)
  const visiblePropertyIds = useMemo(
    () =>
      properties
        .filter((p) => p.hidden !== true)
        .map((p) => p.id) as TProperties[number]["id"][],
    [properties]
  );

  // Store only user overrides (properties explicitly hidden by user)
  const [hiddenByUser, setHiddenByUser] = useState<
    Set<TProperties[number]["id"]>
  >(() => {
    const canBeVisible = properties
      .filter((p) => p.hidden !== true)
      .map((p) => p.id) as TProperties[number]["id"][];

    if (defaultVisibility) {
      const defaultVisible = new Set(defaultVisibility);
      return new Set(canBeVisible.filter((id) => !defaultVisible.has(id)));
    }
    return new Set();
  });

  // Derive visible properties from property definitions + user overrides
  const propertyVisibility = useMemo(
    () => visiblePropertyIds.filter((id) => !hiddenByUser.has(id)),
    [visiblePropertyIds, hiddenByUser]
  );

  const [excludedPropertyIds, setExcludedPropertyIds] = useState<
    TProperties[number]["id"][]
  >([]);

  const setPropertyVisibility = useCallback(
    (visible: TProperties[number]["id"][]) => {
      const visibleSet = new Set(visible);
      setHiddenByUser(
        new Set(visiblePropertyIds.filter((id) => !visibleSet.has(id)))
      );
    },
    [visiblePropertyIds]
  );

  const toggleProperty = useCallback(
    (propertyId: TProperties[number]["id"]) => {
      setHiddenByUser((prev) => {
        const next = new Set(prev);
        if (next.has(propertyId)) {
          next.delete(propertyId);
        } else {
          next.add(propertyId);
        }
        return next;
      });
    },
    []
  );

  const showAllProperties = useCallback(() => {
    setHiddenByUser(new Set());
  }, []);

  const hideAllProperties = useCallback(() => {
    setHiddenByUser(new Set(visiblePropertyIds));
  }, [visiblePropertyIds]);

  const propertyMetas = useMemo(
    () => toPropertyMetaArray(properties),
    [properties]
  );

  const contextValue = useMemo<DataViewContextValue<TData, TProperties>>(
    () => ({
      data,
      properties,
      propertyMetas,
      pagination,
      counts,
      expandedGroups,
      onExpandedGroupsChange,
      filter,
      sort,
      search,
      limit,
      group,
      subGroup,
      propertyVisibility,
      setPropertyVisibility,
      excludedPropertyIds,
      setExcludedPropertyIds,
      toggleProperty,
      showAllProperties,
      hideAllProperties,
    }),
    [
      data,
      properties,
      propertyMetas,
      pagination,
      counts,
      expandedGroups,
      onExpandedGroupsChange,
      filter,
      sort,
      search,
      limit,
      group,
      subGroup,
      propertyVisibility,
      setPropertyVisibility,
      excludedPropertyIds,
      toggleProperty,
      showAllProperties,
      hideAllProperties,
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
