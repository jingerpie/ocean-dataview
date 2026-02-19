"use client";

import { createContext, useContext } from "react";
import type {
  GroupInfinitePaginationState,
  GroupPagePaginationState,
  InfinitePaginationState,
  PagePaginationResult,
} from "../../hooks";
import type {
  DataViewProperty,
  PropertyMeta,
  SortQuery,
  ViewCounts,
  WhereNode,
} from "../../types";

/**
 * Union type for pagination - supports flat, grouped, and infinite pagination
 */
export type PaginationOutput<TData> =
  | PagePaginationResult
  | InfinitePaginationState
  | GroupPagePaginationState<TData>
  | GroupInfinitePaginationState<TData>;

/**
 * Group configuration for views
 */
export interface GroupConfig<TPropertyId extends string = string> {
  /** Controlled expanded groups state */
  expandedGroups?: string[];
  /** Property ID to group by */
  groupBy: TPropertyId;
  /** Hide empty groups */
  hideEmptyGroups?: boolean;
  /** Callback when expanded groups change */
  onExpandedChange?: (groups: string[]) => void;
  /** Show aggregation/count in group headers */
  showAggregation?: boolean;
  /** How to display the grouping */
  showAs?: "day" | "week" | "month" | "year" | "relative" | "group" | "option";
  /** Sort direction for groups */
  sort?: "propertyAscending" | "propertyDescending";
  /** Week start day for week grouping */
  startWeekOn?: "monday" | "sunday";
}

/**
 * Sub-group configuration for BoardView
 */
export interface SubGroupConfig<TPropertyId extends string = string> {
  /** Default expanded sub-groups */
  defaultExpanded?: string[];
  /** Controlled expanded sub-groups state */
  expandedSubGroups?: string[];
  /** Hide empty sub-groups */
  hideEmptyGroups?: boolean;
  /** Callback when expanded sub-groups change */
  onExpandedSubGroupsChange?: (groups: string[]) => void;
  /** How to display the sub-grouping */
  showAs?: "day" | "week" | "month" | "year" | "relative" | "group" | "option";
  /** Sort direction for sub-groups */
  sort?: "propertyAscending" | "propertyDescending";
  /** Week start day for week sub-grouping */
  startWeekOn?: "monday" | "sunday";
  /** Property ID to sub-group by */
  subGroupBy: TPropertyId;
}

export interface DataViewContextValue<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  // Core data
  counts?: ViewCounts;
  data: TData[];

  // Property visibility state
  excludedPropertyIds: TProperties[number]["id"][];

  // Query state (previously in defaults)
  filter?: WhereNode[] | null;

  // View config (previously in view prop)
  group?: GroupConfig<TProperties[number]["id"]>;
  hideAllProperties: () => void;
  limit?: number;
  pagination?: PaginationOutput<TData> | undefined;
  properties: TProperties;
  /** Covariant property metadata - safe to pass to UI components */
  propertyMetas: PropertyMeta[];
  propertyVisibility: TProperties[number]["id"][];
  search?: string;
  setExcludedPropertyIds: (ids: TProperties[number]["id"][]) => void;
  setPropertyVisibility: (visibility: TProperties[number]["id"][]) => void;
  showAllProperties: () => void;
  sort?: SortQuery[];
  subGroup?: SubGroupConfig<TProperties[number]["id"]>;
  toggleProperty: (propertyId: TProperties[number]["id"]) => void;
}

export const DataViewContext = createContext<
  // biome-ignore lint/suspicious/noExplicitAny: Generic context - type safety enforced via useDataViewContext<T>()
  DataViewContextValue<any, any> | undefined
>(undefined);

export function useDataViewContext<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>() {
  const context = useContext(DataViewContext);
  if (!context) {
    throw new Error(
      "useDataViewContext must be used within a DataViewProvider"
    );
  }
  return context as DataViewContextValue<TData, TProperties>;
}
