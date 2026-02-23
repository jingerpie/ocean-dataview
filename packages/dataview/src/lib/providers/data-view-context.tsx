"use client";

import { createContext, useContext } from "react";
import type { InfinitePaginationState, PagePaginationState } from "../../hooks";
import type {
  DataViewProperty,
  GroupConfig,
  PropertyMeta,
  SortQuery,
  SubGroupConfig,
  ViewCounts,
  WhereNode,
} from "../../types";

/**
 * Union type for pagination - supports page and infinite pagination.
 * Both types have `groups` array (flat mode uses single "__all__" group).
 */
export type PaginationOutput<TData> =
  | PagePaginationState<TData>
  | InfinitePaginationState<TData>;

// Re-export for convenience
export type { GroupConfig, SubGroupConfig } from "../../types";

export interface DataViewContextValue<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  // Core data
  counts?: ViewCounts;
  data: TData[];

  // Property visibility state
  excludedPropertyIds: TProperties[number]["id"][];

  // Expanded groups state (view-level concern - accordion open/close)
  expandedGroups?: string[];

  // Query state (previously in defaults)
  filter?: WhereNode[] | null;

  // View config (previously in view prop)
  group?: GroupConfig;
  hideAllProperties: () => void;

  limit?: number;
  onExpandedGroupsChange?: (groups: string[]) => void;
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
  subGroup?: SubGroupConfig;
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
