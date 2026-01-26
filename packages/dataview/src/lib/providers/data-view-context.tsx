"use client";

import type {
  DataViewProperty,
  PropertyMeta,
  SortQuery,
  WhereNode,
} from "@ocean-dataview/dataview/types";
import { createContext, useContext } from "react";
import type {
  GroupInfinitePaginationState,
  GroupPagePaginationState,
  InfinitePaginationState,
  PagePaginationResult,
} from "../../hooks";

/**
 * Union type for pagination - supports flat, grouped, and infinite pagination
 */
export type PaginationOutput<TData> =
  | PagePaginationResult
  | InfinitePaginationState
  | GroupPagePaginationState<TData>
  | GroupInfinitePaginationState<TData>;

/**
 * Default values for DataView state - passed from server props
 * These are the source of truth for the current view state
 */
export interface DataViewDefaults {
  /** Default visible property IDs */
  visibility?: string[];
  /** Current filter state (from server) */
  filter?: WhereNode | null;
  /** Current sort state (from server) */
  sort?: SortQuery[];
  /** Current search string (from server) */
  search?: string;
  /** Default page size */
  limit?: number;
}

export interface DataViewContextValue<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  // Core data
  data: TData[];
  properties: TProperties;
  /** Covariant property metadata - safe to pass to UI components */
  propertyMetas: PropertyMeta[];

  // Default values for URL state (when URL params are empty)
  defaults?: DataViewDefaults;

  // Property visibility state
  propertyVisibility: TProperties[number]["id"][];
  setPropertyVisibility: (visibility: TProperties[number]["id"][]) => void;

  // Excluded properties (e.g., grouped column) - set by view component
  excludedPropertyIds: TProperties[number]["id"][];
  setExcludedPropertyIds: (ids: TProperties[number]["id"][]) => void;

  // Helper methods
  toggleProperty: (propertyId: TProperties[number]["id"]) => void;
  showAllProperties: () => void;
  hideAllProperties: () => void;

  // Pagination (flat or grouped)
  pagination?: PaginationOutput<TData> | undefined;
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
