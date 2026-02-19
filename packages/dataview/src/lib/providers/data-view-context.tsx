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
 * Default values for DataView state - passed from server props
 * These are the source of truth for the current view state
 */
export interface DataViewDefaults {
  /** Current filter state (from server) - array of WhereNode (implicit AND) */
  filter?: WhereNode[] | null;
  /** Default page size */
  limit?: number;
  /** Current search string (from server) */
  search?: string;
  /** Current sort state (from server) */
  sort?: SortQuery[];
  /** Default visible property IDs */
  visibility?: string[];
}

export interface DataViewContextValue<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  // Counts for group headers (and optionally sub-group headers for BoardView)
  counts?: ViewCounts;
  // Core data
  data: TData[];

  // Default values for URL state (when URL params are empty)
  defaults?: DataViewDefaults;

  // Excluded properties (e.g., grouped column) - set by view component
  excludedPropertyIds: TProperties[number]["id"][];
  hideAllProperties: () => void;

  // Pagination (flat or grouped)
  pagination?: PaginationOutput<TData> | undefined;
  properties: TProperties;
  /** Covariant property metadata - safe to pass to UI components */
  propertyMetas: PropertyMeta[];

  // Property visibility state
  propertyVisibility: TProperties[number]["id"][];
  setExcludedPropertyIds: (ids: TProperties[number]["id"][]) => void;
  setPropertyVisibility: (visibility: TProperties[number]["id"][]) => void;
  showAllProperties: () => void;

  // Helper methods
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
