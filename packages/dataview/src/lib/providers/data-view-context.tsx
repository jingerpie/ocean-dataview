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
  GroupConfig,
  PropertyMeta,
  SortQuery,
  SubGroupConfig,
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

  // Query state (previously in defaults)
  filter?: WhereNode[] | null;

  // View config (previously in view prop)
  group?: GroupConfig;
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
