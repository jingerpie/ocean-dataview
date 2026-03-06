"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  useFilterParams,
  useSearchParams,
  useSortParams,
} from "../../../hooks";
import { useToolbarState } from "../../../hooks/use-toolbar-state";
import { useToolbarContextOptional } from "../../../lib/providers/toolbar-context";
import { cn } from "../../../lib/utils";
import type { GroupConfig, PropertyMeta } from "../../../types";
import { Separator } from "../../ui/separator";
import { SearchInput } from "../../ui/toolbar/search/search-input";
import { ChipsBar } from "./chips-bar";
import { FilterTool } from "./filter-tool";
import { SettingsTool } from "./settings-tool";
import { SortTool } from "./sort-tool";

/**
 * Extract the property ID from a GroupConfig.
 */
function getGroupPropertyId(
  group: GroupConfig | null | undefined
): string | null {
  if (!group) {
    return null;
  }
  if ("bySelect" in group) {
    return group.bySelect.property;
  }
  if ("byStatus" in group) {
    return group.byStatus.property;
  }
  if ("byDate" in group) {
    return group.byDate.property;
  }
  if ("byCheckbox" in group) {
    return group.byCheckbox.property;
  }
  if ("byMultiSelect" in group) {
    return group.byMultiSelect.property;
  }
  if ("byText" in group) {
    return group.byText.property;
  }
  if ("byNumber" in group) {
    return group.byNumber.property;
  }
  return null;
}

/**
 * Extract the property ID from a ColumnConfig.
 * ColumnConfig uses the same structure as GroupConfig.
 */
function getColumnPropertyId(
  column: GroupConfig | null | undefined
): string | null {
  return getGroupPropertyId(column);
}

interface NotionToolbarProps extends ComponentProps<"div"> {
  /** Children (tabs, etc.) - always visible on left */
  children?: ReactNode;
  /** Current column property name (board view only) */
  columnProperty?: string;
  /** Enable column setting in settings panel (board view only) */
  enableColumn?: boolean;
  /** Enable filter functionality */
  enableFilter?: boolean;
  /** Enable search functionality */
  enableSearch?: boolean;
  /** Enable view settings panel */
  enableSettings?: boolean;
  /** Enable sort functionality */
  enableSort?: boolean;
  /** Current group property name (displayed in settings panel) */
  groupProperty?: string;
  /** Property definitions for filtering/sorting (optional if using context) */
  properties?: readonly PropertyMeta[];
}

/**
 * Notion-style toolbar with two-row layout.
 *
 * When used inside DataViewProvider, reads properties and visibility from context.
 * Props can override context values if needed.
 *
 * State managed via nuqs URL params:
 * - ?filter={...} for filters
 * - ?sort=[...] for sorting
 * - ?search=... for search
 *
 * Row 1: [children] -------- [Filter] [Sort] [Search] [Properties] [Settings]
 * Row 2: [SortList] [Filter Chips...] [+ Filter] (conditional)
 *
 * @example
 * ```tsx
 * // Inside DataViewProvider - uses context automatically
 * <DataViewProvider properties={productProperties} ...>
 *   <NotionToolbar enableSettings />
 *   <TableView />
 * </DataViewProvider>
 * ```
 */
function NotionToolbarComponent({
  children,
  className,
  columnProperty,
  enableColumn = false,
  enableFilter = true,
  enableSearch = true,
  enableSettings = false,
  enableSort = true,
  groupProperty,
  properties: propProperties,
  ...props
}: NotionToolbarProps) {
  // Try to get values from context, fall back to props
  const ctx = useToolbarContextOptional();

  const properties = propProperties ?? ctx?.properties ?? [];

  // Derive group property label from context if not provided
  const derivedGroupProperty = (() => {
    if (groupProperty !== undefined) {
      return groupProperty;
    }
    const groupPropertyId = getGroupPropertyId(ctx?.group);
    if (!groupPropertyId) {
      return undefined;
    }
    const meta = properties.find((p) => p.id === groupPropertyId);
    return meta?.label ?? groupPropertyId;
  })();

  // Derive column property label from context if not provided
  const derivedColumnProperty = (() => {
    if (columnProperty !== undefined) {
      return columnProperty;
    }
    const colPropertyId = getColumnPropertyId(ctx?.column);
    if (!colPropertyId) {
      return undefined;
    }
    const meta = properties.find((p) => p.id === colPropertyId);
    return meta?.label ?? colPropertyId;
  })();

  // Auto-enable column settings when column config exists (board view)
  const shouldEnableColumn = enableColumn || ctx?.column != null;

  // State managed via hooks that read/write URL directly
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

          {/* Settings */}
          {enableSettings && (
            <SettingsTool
              columnProperty={derivedColumnProperty}
              enableColumn={shouldEnableColumn}
              groupProperty={derivedGroupProperty}
              variant="icon"
            />
          )}
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

// Add static slot marker for DataViewProvider child splitting
NotionToolbarComponent.dataViewSlot = "toolbar" as const;

/**
 * NotionToolbar with static slot marker.
 * When placed inside DataViewProvider, it renders outside the suspending QueryBridge.
 */
export const NotionToolbar =
  NotionToolbarComponent as typeof NotionToolbarComponent & {
    dataViewSlot: "toolbar";
  };

export type { NotionToolbarProps };
