"use client";

import type { Limit, SortQuery, WhereNode } from "@sparkyidea/shared/types";
import {
  Children,
  isValidElement,
  type ReactNode,
  Suspense,
  useMemo,
  useState,
} from "react";
import { GroupSectionSkeleton } from "../../components/ui/group-section-skeleton";
import { BoardSkeleton } from "../../components/views/board-view/board-skeleton";
import { GallerySkeleton } from "../../components/views/gallery-view/gallery-skeleton";
import { ListSkeleton } from "../../components/views/list-view/list-skeleton";
import { TableSkeleton } from "../../components/views/table-view/table-skeleton";
import type { PropertyType } from "../../types";
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
// Child Slot Splitting & View Type Detection
// ============================================================================

/** Static marker for toolbar components */
export const TOOLBAR_SLOT = "toolbar" as const;

/** View type markers for skeleton selection */
export type DataViewType = "board" | "table" | "list" | "gallery";

/**
 * Component type with optional dataViewSlot and dataViewType markers.
 */
interface MarkedComponent {
  dataViewSlot?: typeof TOOLBAR_SLOT;
  dataViewType?: DataViewType;
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
      const type = child.type as MarkedComponent;
      if (type.dataViewSlot === TOOLBAR_SLOT) {
        toolbarChildren.push(child);
        continue;
      }
    }
    contentChildren.push(child);
  }

  return { toolbarChildren, contentChildren };
}

/**
 * Detect view type from content children.
 * Views are identified by the static `dataViewType` marker.
 */
function detectViewType(children: ReactNode[]): DataViewType | undefined {
  for (const child of children) {
    if (isValidElement(child)) {
      const type = child.type as MarkedComponent;
      if (type.dataViewType) {
        return type.dataViewType;
      }
    }
  }
  return undefined;
}

/**
 * Render the appropriate skeleton based on detected view type.
 */
function renderViewSkeleton(
  viewType: DataViewType | undefined,
  propertyTypes: PropertyType[],
  rowCount: number,
  isGrouped: boolean
): ReactNode {
  // For grouped views (except board which handles it internally), show group section skeleton
  if (isGrouped && viewType !== "board") {
    return <GroupSectionSkeleton />;
  }

  switch (viewType) {
    case "board":
      return (
        <BoardSkeleton
          cardsPerColumn={rowCount}
          columnCount={10}
          groupCount={isGrouped ? 10 : 0}
          propertyTypes={propertyTypes}
        />
      );
    case "table":
      return (
        <TableSkeleton propertyTypes={propertyTypes} rowCount={rowCount} />
      );
    case "list":
      return <ListSkeleton propertyTypes={propertyTypes} rowCount={rowCount} />;
    case "gallery":
      return (
        <GallerySkeleton cardCount={rowCount} propertyTypes={propertyTypes} />
      );
    default:
      // Fallback for unknown view types
      return <GroupSectionSkeleton />;
  }
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
  /** Column counts - passed directly for board views (deprecated, use columnQueryOptionsFactory in pagination hook) */
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
      columnCounts: controllerProps.columnCounts,
      counts: controllerProps.counts,
      properties,
      propertyVisibility: controllerProps.propertyVisibility,
    };

    // Detect view type from children and grouped mode
    const viewType = detectViewType(contentChildren);
    const isGrouped = Boolean(controllerProps.defaults?.group);

    // Calculate skeleton values from known config
    const limit = controllerProps.defaults?.limit ?? 10;
    const visibleProperties = properties.filter((p) => !p.hidden);
    const propertyTypes = visibleProperties.map((p) => p.type);

    // Choose appropriate skeleton based on detected view type
    const fallbackSkeleton = renderViewSkeleton(
      viewType,
      propertyTypes,
      limit,
      isGrouped
    );

    return (
      <ToolbarContextProvider
        column={controllerProps.defaults?.column}
        group={controllerProps.defaults?.group}
        properties={propertyMetas}
      >
        <div className={cn("flex flex-col gap-2", className)}>
          {toolbarChildren}
          <Suspense fallback={fallbackSkeleton}>
            <PageQueryBridge<TData, TProperties, TQueryOptions>
              controller={pagination}
              defaults={controllerProps.defaults}
              viewProps={viewProps}
            >
              {contentChildren}
            </PageQueryBridge>
          </Suspense>
        </div>
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
      columnCounts: controllerProps.columnCounts,
      counts: controllerProps.counts,
      properties,
      propertyVisibility: controllerProps.propertyVisibility,
    };

    // Detect view type from children and grouped mode
    const viewType = detectViewType(contentChildren);
    const isGrouped = Boolean(controllerProps.defaults?.group);

    // Calculate skeleton values from known config
    const limit = controllerProps.defaults?.limit ?? 10;
    const visibleProperties = properties.filter((p) => !p.hidden);
    const propertyTypes = visibleProperties.map((p) => p.type);

    // Choose appropriate skeleton based on detected view type
    const fallbackSkeleton = renderViewSkeleton(
      viewType,
      propertyTypes,
      limit,
      isGrouped
    );

    return (
      <ToolbarContextProvider
        column={controllerProps.defaults?.column}
        group={controllerProps.defaults?.group}
        properties={propertyMetas}
      >
        <div className={cn("flex flex-col gap-2", className)}>
          {toolbarChildren}
          <Suspense fallback={fallbackSkeleton}>
            <InfiniteQueryBridge<TData, TProperties, TQueryOptions>
              controller={pagination}
              defaults={controllerProps.defaults}
              viewProps={viewProps}
            >
              {contentChildren}
            </InfiniteQueryBridge>
          </Suspense>
        </div>
      </ToolbarContextProvider>
    );
  }

  // Direct data path (backwards compatible)
  const directProps = props as DirectDataProps<TData, TProperties>;

  return (
    <ToolbarContextProvider
      column={directProps.column}
      group={directProps.group}
      properties={propertyMetas}
    >
      <div className={cn("flex flex-col gap-2", className)}>
        {toolbarChildren}
        <DataViewProviderCore<TData, TProperties> {...directProps}>
          {contentChildren}
        </DataViewProviderCore>
      </div>
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
