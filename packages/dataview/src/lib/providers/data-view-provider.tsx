"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import {
  type DataViewProperty,
  type GroupConfig,
  type SortQuery,
  type SubGroupConfig,
  toPropertyMetaArray,
  type ViewCounts,
  type WhereNode,
} from "../../types";
import { cn } from "../utils";
import {
  DataViewContext,
  type DataViewContextValue,
  type PaginationOutput,
} from "./data-view-context";

export interface DataViewProviderProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  children: ReactNode;
  className?: string;
  /**
   * Counts from server for group headers
   * - group: Primary grouping counts (column headers in BoardView, group headers in other views)
   * - subGroup: Secondary grouping counts (row headers in BoardView with sub-groups)
   */
  counts?: ViewCounts;
  data: TData[];

  /**
   * Currently expanded groups (view-level concern - accordion open/close)
   * - Board view: expanded subGroup rows
   * - Table/List/Gallery: expanded group rows
   */
  expandedGroups?: string[];

  // Query state (flattened from defaults)
  /** Current filter state (from server) - array of WhereNode (implicit AND) */
  filter?: WhereNode[] | null;

  // View config (flattened from view prop)
  /** Group configuration */
  group?: GroupConfig;

  /** Default page size */
  limit?: number;

  /** Callback when expanded groups change */
  onExpandedGroupsChange?: (groups: string[]) => void;

  pagination?: PaginationOutput<TData> | undefined;
  properties: TProperties;
  /** Default visible property IDs */
  propertyVisibility?: TProperties[number]["id"][];
  /** Current search string (from server) */
  search?: string;
  /** Current sort state (from server) */
  sort?: SortQuery[];
  /** Sub-group configuration (BoardView only) */
  subGroup?: SubGroupConfig;
}

export function DataViewProvider<
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
  // Expanded groups state (view-level - accordion open/close)
  expandedGroups,
  onExpandedGroupsChange,
  // Query state (flattened)
  filter,
  sort,
  search,
  limit,
  // View config (flattened)
  group,
  subGroup,
  propertyVisibility: defaultVisibility,
}: DataViewProviderProps<TData, TProperties>) {
  // Get all property IDs that CAN be visible (hidden !== true in definition)
  const visiblePropertyIds = useMemo(
    () =>
      properties
        .filter((p) => p.hidden !== true)
        .map((p) => p.id) as TProperties[number]["id"][],
    [properties]
  );

  // Store only user overrides (properties explicitly hidden by user)
  // This is the minimal state - visibility is derived from properties + overrides
  const [hiddenByUser, setHiddenByUser] = useState<
    Set<TProperties[number]["id"]>
  >(() => {
    // Inline computation since visiblePropertyIds memo isn't available yet
    const canBeVisible = properties
      .filter((p) => p.hidden !== true)
      .map((p) => p.id) as TProperties[number]["id"][];

    if (defaultVisibility) {
      // defaultVisibility = IDs that should be visible
      // hiddenByUser = IDs that should be hidden (inverse)
      const defaultVisible = new Set(defaultVisibility);
      return new Set(canBeVisible.filter((id) => !defaultVisible.has(id)));
    }
    return new Set();
  });

  // Derive visible properties from property definitions + user overrides
  // This automatically handles HMR changes to property definitions
  const propertyVisibility = useMemo(
    () => visiblePropertyIds.filter((id) => !hiddenByUser.has(id)),
    [visiblePropertyIds, hiddenByUser]
  );

  const [excludedPropertyIds, setExcludedPropertyIds] = useState<
    TProperties[number]["id"][]
  >([]);

  // Public API: setPropertyVisibility converts to internal hiddenByUser format
  const setPropertyVisibility = useCallback(
    (visible: TProperties[number]["id"][]) => {
      const visibleSet = new Set(visible);
      // Hidden = all possible visible IDs minus the ones being set as visible
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
          next.delete(propertyId); // Show
        } else {
          next.add(propertyId); // Hide
        }
        return next;
      });
    },
    []
  );

  // Show all properties - clear all user overrides
  const showAllProperties = useCallback(() => {
    setHiddenByUser(new Set());
  }, []);

  // Hide all properties that CAN be hidden
  // (properties with hidden: true in definition are already always hidden)
  const hideAllProperties = useCallback(() => {
    setHiddenByUser(new Set(visiblePropertyIds));
  }, [visiblePropertyIds]);

  // Convert properties to covariant PropertyMeta[] for UI components
  const propertyMetas = useMemo(
    () => toPropertyMetaArray(properties),
    [properties]
  );

  const contextValue = useMemo<DataViewContextValue<TData, TProperties>>(
    () => ({
      // Core data
      data,
      properties,
      propertyMetas,
      pagination,
      counts,
      // Expanded groups state (view-level - accordion open/close)
      expandedGroups,
      onExpandedGroupsChange,
      // Query state (flattened)
      filter,
      sort,
      search,
      limit,
      // View config (flattened)
      group,
      subGroup,
      // Property visibility state
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
