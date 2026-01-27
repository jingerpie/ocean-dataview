"use client";

import {
  useFilterParams,
  useSearchParams,
  useSortParams,
} from "@ocean-dataview/dataview/hooks";
import { useDataViewContext } from "@ocean-dataview/dataview/lib/providers";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { PropertyMeta } from "@ocean-dataview/dataview/types";
import type { ComponentProps, ReactNode } from "react";
import { FilterPropertyPicker } from "../filter";
import { SearchInput } from "../search";
import { SortPropertyPicker } from "../sort";
import { useToolbarState } from "../toolbar";
import { DataViewOptions } from "../visibility";
import { ChipsBar } from "./chips-bar";

interface NotionToolbarProps extends ComponentProps<"div"> {
  /**
   * Available properties for filtering/sorting.
   * Optional - defaults to propertyMetas from DataViewContext.
   */
  properties?: readonly PropertyMeta[];
  /** Enable filter functionality */
  enableFilter?: boolean;
  /** Enable sort functionality */
  enableSort?: boolean;
  /** Enable search functionality */
  enableSearch?: boolean;
  /** Enable properties visibility button */
  enableProperties?: boolean;
  /** Children (tabs, etc.) - always visible on left */
  children?: ReactNode;
}

/**
 * Notion-style toolbar with two-row layout.
 *
 * State is managed internally via nuqs URL params:
 * - ?filter={...} for filters
 * - ?sort=[...] for sorting
 * - ?search=... for search
 *
 * Reads defaults from DataViewContext if available.
 *
 * Row 1: [children] -------- [Filter] [Sort] [Search] [Properties]
 * Row 2: [SortList] [Filter Chips...] [+ Filter] (conditional)
 *
 * @example
 * ```tsx
 * // Properties from context (recommended)
 * <NotionToolbar>
 *   <MyTabs />
 * </NotionToolbar>
 *
 * // Or with explicit properties
 * <NotionToolbar properties={productProperties}>
 *   <MyTabs />
 * </NotionToolbar>
 * ```
 */
export function NotionToolbar({
  properties: propProperties,
  enableFilter = true,
  enableSort = true,
  enableSearch = true,
  enableProperties = true,
  children,
  className,
  ...props
}: NotionToolbarProps) {
  // Get propertyMetas from context
  const { propertyMetas } = useDataViewContext();

  // Use prop properties if provided, otherwise fall back to context
  const properties = propProperties ?? propertyMetas;

  // State managed via hooks that read from context defaults, write to URL
  const { filter, setFilter: onFilterChange, resetFilter } = useFilterParams();
  const { search, setSearch: onSearchChange } = useSearchParams();
  const { sort: sorts, setSort: onSortsChange, resetSort } = useSortParams();

  const {
    hasActiveControls,
    row2Visible,
    toggleRow2,
    simpleFilterConditions,
    advancedFilter,
    advancedFilterIndex,
    ruleCount,
  } = useToolbarState({ filter, sorts });

  return (
    <div
      aria-orientation="horizontal"
      className={cn("flex flex-col gap-2", className)}
      role="toolbar"
      {...props}
    >
      {/* Row 1: Primary Toolbar */}
      <div className="flex h-9 items-center gap-2">
        {/* Left side: Children (tabs, etc.) */}
        {children && <div className="flex flex-1 gap-2">{children}</div>}

        {/* Right side: Controls */}
        <div className="ml-auto flex items-center gap-1">
          {/* Filter - single picker with conditional onClick */}
          {enableFilter && (
            <FilterPropertyPicker
              onClick={filter !== null ? toggleRow2 : undefined}
              properties={properties}
              variant="icon"
            />
          )}

          {/* Sort - single picker with conditional onClick */}
          {enableSort && (
            <SortPropertyPicker
              onClick={sorts.length > 0 ? toggleRow2 : undefined}
              properties={properties}
              variant="icon"
            />
          )}

          {/* Search Input */}
          {enableSearch && (
            <SearchInput
              onChange={onSearchChange}
              placeholder="Type to search..."
              value={search}
              variant="icon"
            />
          )}

          {/* Properties Visibility */}
          {enableProperties && <DataViewOptions variant="icon" />}
        </div>
      </div>

      {/* Row 2: Chips Bar (conditional) */}
      {hasActiveControls && row2Visible && (
        <ChipsBar
          advancedFilter={advancedFilter}
          advancedFilterIndex={advancedFilterIndex}
          filter={filter}
          onFilterChange={onFilterChange}
          onReset={() => {
            resetFilter();
            resetSort();
          }}
          onSortsChange={onSortsChange}
          properties={properties}
          ruleCount={ruleCount}
          simpleFilterConditions={simpleFilterConditions}
          sorts={sorts}
        />
      )}
    </div>
  );
}

export type { NotionToolbarProps };
