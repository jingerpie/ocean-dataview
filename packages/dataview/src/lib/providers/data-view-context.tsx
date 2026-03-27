"use client";

import { createContext, useContext } from "react";
import type { InfinitePaginationState } from "../../hooks/use-infinite-controller";
import type { PagePaginationState } from "../../hooks/use-page-controller";
import type { SortQuery, WhereNode } from "../../types/filter.type";
import type {
  ColumnConfigInput,
  GroupConfigInput,
} from "../../types/group.type";
import type { GroupCounts, ViewCounts } from "../../types/pagination-types";
import type { DataViewProperty, PropertyMeta } from "../../types/property.type";

/**
 * Union type for pagination - supports page and infinite pagination.
 * Both types have `groups` array (flat mode uses single "__ungrouped__" group).
 */
export type PaginationOutput<TData> =
  | PagePaginationState<TData>
  | InfinitePaginationState<TData>;

// Re-export for convenience
export type {
  ColumnConfigInput,
  GroupConfigInput,
} from "../../types/group.type";

export interface DataViewContextValue<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  // Column state (board-specific - visual columns)
  column?: ColumnConfigInput | null;
  columnCounts?: GroupCounts;

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
  group?: GroupConfigInput | null;

  /**
   * Keys for all groups (from server group counts query).
   * Views iterate over this to render group headers.
   * Empty array means no groups / flat mode.
   */
  groupKeys?: string[];

  // Group pagination state
  hasNextGroupPage?: boolean;
  isFetchingNextGroupPage?: boolean;

  limit?: number;
  onColumnChange?: (column: ColumnConfigInput | null) => void;
  onExpandedGroupsChange?: (groups: string[]) => void;
  onLoadMoreGroups?: () => void;
  pagination?: PaginationOutput<TData> | undefined;
  properties: TProperties;
  /** Covariant property metadata - safe to pass to UI components */
  propertyMetas: PropertyMeta[];
  propertyVisibility: TProperties[number]["id"][];
  search?: string;
  setExcludedPropertyIds: (ids: TProperties[number]["id"][]) => void;
  sort?: SortQuery[];
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
