"use client";

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
import type {
  PropertyType,
  SortQuery,
  WhereNode,
} from "../../types/filter.type";
import type {
  ColumnConfigInput,
  GroupConfigInput,
} from "../../types/group.type";
import type { Limit } from "../../types/pagination";
import type {
  InfiniteController,
  PageController,
} from "../../types/pagination-controller";
import type { GroupCounts, ViewCounts } from "../../types/pagination-types";
import {
  type DataViewProperty,
  toPropertyMetaArray,
} from "../../types/property.type";
import { cn } from "../utils";
import {
  DataViewContext,
  type DataViewContextValue,
  type PaginationOutput,
} from "./data-view-context";
import { InfiniteQueryBridge, PageQueryBridge } from "./query-bridge";
import {
  QueryParamsProvider,
  useQueryParamsState,
} from "./query-params-context";
import { ToolbarContextProvider } from "./toolbar-context";

// ============================================================================
// Child Slot Splitting & View Type Detection
// ============================================================================

/** Static marker for toolbar components */
export const TOOLBAR_SLOT = "toolbar" as const;

/** View type markers for skeleton selection */
export type DataViewType = "board" | "table" | "list" | "gallery";

/**
 * Component type for toolbar slot detection.
 */
interface MarkedComponent {
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
 * Component type with required view markers.
 */
interface ViewComponent {
  dataViewType: DataViewType;
  defaultLimit: Limit;
}

/**
 * Detect view metadata from content children.
 * Views define their type via `dataViewType` and default limit via `defaultLimit` markers.
 * Throws if no view component is found.
 */
function detectViewMetadata(children: ReactNode[]): ViewComponent {
  for (const child of children) {
    if (isValidElement(child)) {
      const type = child.type as Partial<ViewComponent>;
      if (type.dataViewType && type.defaultLimit !== undefined) {
        return {
          dataViewType: type.dataViewType,
          defaultLimit: type.defaultLimit,
        };
      }
    }
  }
  throw new Error(
    "DataViewProvider requires a view component (TableView, ListView, GalleryView, or BoardView) as a child."
  );
}

/**
 * Render the appropriate skeleton based on detected view type.
 */
function renderViewSkeleton(
  viewType: DataViewType,
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
      throw new Error(`Unknown view type: ${viewType}`);
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

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if controller prop is a PageController.
 */
function isPageController<TQueryOptions>(
  controller: PageController<TQueryOptions> | InfiniteController<TQueryOptions>
): controller is PageController<TQueryOptions> {
  return controller.type === "page";
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
  className?: string;
  /** Column counts - passed directly for board views (deprecated, use columnQuery in controller hook) */
  columnCounts?: GroupCounts;
  controller: PageController<TQueryOptions> | InfiniteController<TQueryOptions>;
  counts?: Partial<ViewCounts>;
  /** URL defaults - values used when URL has no corresponding parameter */
  defaults?: DefaultsConfig;
  properties: TProperties;
  propertyVisibility?: TProperties[number]["id"][];
}

// ============================================================================
// Component
// ============================================================================

export function DataViewProvider<
  TData = unknown,
  TProperties extends
    readonly DataViewProperty<TData>[] = readonly DataViewProperty<TData>[],
  // biome-ignore lint/suspicious/noExplicitAny: Controller is generic
  TQueryOptions = any,
>({
  children,
  className,
  columnCounts,
  controller,
  counts,
  defaults,
  properties,
  propertyVisibility,
}: DataViewProviderProps<TData, TProperties, TQueryOptions>) {
  // Detect view metadata (type and default limit)
  const { contentChildren } = splitChildren(children);
  const viewMetadata = detectViewMetadata(contentChildren);
  const mergedDefaults = {
    ...defaults,
    limit: defaults?.limit ?? viewMetadata.defaultLimit,
  };

  // Wrap with QueryParamsProvider for single source of truth
  return (
    <QueryParamsProvider defaults={mergedDefaults} properties={properties}>
      <DataViewProviderWithQueryParams<TData, TProperties, TQueryOptions>
        className={className}
        columnCounts={columnCounts}
        controller={controller}
        counts={counts}
        mergedDefaults={mergedDefaults}
        properties={properties}
        propertyVisibility={propertyVisibility}
        viewMetadata={viewMetadata}
      >
        {children}
      </DataViewProviderWithQueryParams>
    </QueryParamsProvider>
  );
}

// ============================================================================
// Inner Component (uses QueryParamsContext)
// ============================================================================

interface DataViewProviderWithQueryParamsProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
  TQueryOptions,
> {
  children: ReactNode;
  className?: string;
  columnCounts?: GroupCounts;
  controller: PageController<TQueryOptions> | InfiniteController<TQueryOptions>;
  counts?: Partial<ViewCounts>;
  mergedDefaults: DefaultsConfig;
  properties: TProperties;
  propertyVisibility?: TProperties[number]["id"][];
  viewMetadata: { dataViewType: DataViewType; defaultLimit: Limit };
}

/**
 * Inner component that reads from QueryParamsContext for skeleton logic.
 * This component is rendered inside QueryParamsProvider.
 */
function DataViewProviderWithQueryParams<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
  TQueryOptions,
>({
  children,
  className,
  columnCounts,
  controller,
  counts,
  mergedDefaults,
  properties,
  propertyVisibility,
  viewMetadata,
}: DataViewProviderWithQueryParamsProps<TData, TProperties, TQueryOptions>) {
  // Read validated state from QueryParamsContext
  const queryParams = useQueryParamsState();
  const { group, limit } = queryParams;
  const isGrouped = group !== null;

  // Split children
  const { toolbarChildren, contentChildren } = splitChildren(children);

  // Convert properties to PropertyMeta array for ToolbarContextProvider
  const propertyMetas = toPropertyMetaArray(properties);

  // Build view props for QueryBridge
  const viewProps = {
    columnCounts,
    counts,
    properties,
    propertyVisibility,
  };

  // Calculate skeleton values from validated state
  const visibleProperties = properties.filter((p) => !p.hidden);
  const propertyTypes = visibleProperties.map((p) => p.type);

  // Choose appropriate skeleton based on detected view type and validated group state
  const fallbackSkeleton = renderViewSkeleton(
    viewMetadata.dataViewType,
    propertyTypes,
    limit,
    isGrouped
  );

  // Determine controller type
  const isPage = isPageController(controller);

  // BoardView requires InfiniteController - fail fast with actionable error
  if (viewMetadata.dataViewType === "board" && isPage) {
    throw new Error(
      "BoardView requires an InfiniteController. " +
        "Use useInfiniteController() instead of usePageController(). " +
        "Board views only support infinite pagination modes (loadMore, infiniteScroll)."
    );
  }

  return (
    <ToolbarContextProvider properties={propertyMetas}>
      <div className={cn("flex flex-col gap-2", className)}>
        {toolbarChildren}
        {/* Key changes when isGrouped changes, forcing new Suspense boundary with correct fallback */}
        <Suspense
          fallback={fallbackSkeleton}
          key={isGrouped ? "grouped" : "flat"}
        >
          {isPage ? (
            <PageQueryBridge<TData, TProperties, TQueryOptions>
              controller={controller as PageController<TQueryOptions>}
              defaults={mergedDefaults}
              viewProps={viewProps}
            >
              {contentChildren}
            </PageQueryBridge>
          ) : (
            <InfiniteQueryBridge<TData, TProperties, TQueryOptions>
              controller={controller as InfiniteController<TQueryOptions>}
              defaults={mergedDefaults}
              viewProps={viewProps}
            >
              {contentChildren}
            </InfiniteQueryBridge>
          )}
        </Suspense>
      </div>
    </ToolbarContextProvider>
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

// Re-export PaginationOutput for backward compatibility
export type { PaginationOutput } from "./data-view-context";
