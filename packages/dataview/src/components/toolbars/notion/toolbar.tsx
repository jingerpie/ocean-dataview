"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  useFilterParams,
  useSearchParams,
  useSortParams,
} from "../../../hooks";
import { useToolbarState } from "../../../hooks/use-toolbar-state";
import { useDataViewContext } from "../../../lib/providers";
import { cn } from "../../../lib/utils";
import type { PropertyMeta } from "../../../types";
import { Separator } from "../../ui/separator";
import { SearchInput } from "../../ui/toolbar/search/search-input";
import { Visibility } from "../../ui/toolbar/visibility";
import { ChipsBar } from "./chips-bar";
import { FilterTool } from "./filter-tool";
import { SortTool } from "./sort-tool";

interface NotionToolbarProps extends ComponentProps<"div"> {
  /** Children (tabs, etc.) - always visible on left */
  children?: ReactNode;
  /** Enable filter functionality */
  enableFilter?: boolean;
  /** Enable properties visibility button */
  enableProperties?: boolean;
  /** Enable search functionality */
  enableSearch?: boolean;
  /** Enable sort functionality */
  enableSort?: boolean;
  /**
   * Available properties for filtering/sorting.
   * Optional - defaults to propertyMetas from DataViewContext.
   */
  properties?: readonly PropertyMeta[];
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
  const { sort: sorts, resetSort } = useSortParams();

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
        <div className="ml-auto flex items-center">
          {/* Filter */}
          {enableFilter && (
            <FilterTool onToggle={toggleRow2} properties={properties} />
          )}

          {/* Sort */}
          {enableSort && (
            <SortTool onToggle={toggleRow2} properties={properties} />
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
          {enableProperties && <Visibility variant="icon" />}
        </div>
      </div>

      {/* Row 2: Chips Bar (conditional) */}
      {hasActiveControls && row2Visible && (
        <>
          <Separator orientation="horizontal" />
          <ChipsBar
            advancedFilter={advancedFilter}
            advancedFilterIndex={advancedFilterIndex}
            filter={filter}
            onFilterChange={onFilterChange}
            onReset={() => {
              resetFilter();
              resetSort();
            }}
            properties={properties}
            ruleCount={ruleCount}
            simpleFilterConditions={simpleFilterConditions}
          />
        </>
      )}
    </div>
  );
}

export type { NotionToolbarProps };
