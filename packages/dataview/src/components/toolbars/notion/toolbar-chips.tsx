"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFilterParams } from "../../../hooks/use-filter-params";
import { useSortParams } from "../../../hooks/use-sort-params";
import { useToolbarContext } from "../../../lib/providers/toolbar-context";
import { cn } from "../../../lib/utils";
import type { PropertyMeta } from "../../../types/property.type";
import { analyzeFilter } from "../../../utils/filter-builder";
import { Separator } from "../../ui/separator";
import { ChipsBar } from "./chips-bar";

interface NotionToolbarChipsProps {
  /** Additional class names for the row container */
  className?: string;
  /** Property schema for filtering/sorting (optional if using context) */
  properties?: readonly PropertyMeta[];
}

/**
 * The Notion toolbar's full-width chips row:
 * [SortList] [Filter Chips...] [+ Filter] [Reset]
 *
 * Renders nothing unless filters or sorts are active *and* the row is
 * expanded. Visibility lives in ToolbarContext so it can be toggled from
 * a `<NotionToolbarActions />` rendered elsewhere (e.g. inside a
 * `PresetTabs` `trailing` slot). Adding a filter or sort auto-expands it.
 *
 * Place it as a direct `DataViewProvider` child, after the row(s) that
 * hold the actions.
 */
function NotionToolbarChipsComponent({
  className,
  properties: propProperties,
}: NotionToolbarChipsProps) {
  const {
    chipsRowVisible,
    properties: ctxProperties,
    setChipsRowVisible,
  } = useToolbarContext();
  const properties = propProperties ?? ctxProperties;

  // State managed via hooks that read/write URL directly
  const { filter, setFilter: onFilterChange, resetFilter } = useFilterParams();
  const { sort: sorts, resetSort } = useSortParams();

  // Analyze filter structure: simple rules at root → chips, first
  // WhereExpression at root → advanced filter chip.
  const filterAnalysis = useMemo(() => analyzeFilter(filter), [filter]);

  // Empty arrays are considered "no filter/sort"
  const hasActiveControls =
    (filter !== null && filter.length > 0) || sorts.length > 0;

  // Auto-expand when a filter or sort is added
  const controlCount = (filter?.length ?? 0) + sorts.length;
  const prevControlCount = useRef(controlCount);
  useEffect(() => {
    if (controlCount > prevControlCount.current) {
      setChipsRowVisible(true);
    }
    prevControlCount.current = controlCount;
  }, [controlCount, setChipsRowVisible]);

  if (!(hasActiveControls && chipsRowVisible)) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Separator orientation="horizontal" />
      <ChipsBar
        advancedFilter={filterAnalysis.advancedFilter}
        advancedFilterIndex={filterAnalysis.advancedFilterIndex}
        filter={filter}
        onFilterChange={onFilterChange}
        onReset={() => {
          resetFilter();
          resetSort();
        }}
        properties={properties}
        ruleCount={filterAnalysis.ruleCount}
        simpleFilterConditions={filterAnalysis.simpleConditions}
      />
    </div>
  );
}

// Static slot marker for DataViewProvider child splitting: renders in the
// toolbar group, in JSX order with the other toolbar-slot children.
NotionToolbarChipsComponent.dataViewSlot = "toolbar" as const;

/**
 * NotionToolbarChips with static slot marker.
 */
export const NotionToolbarChips =
  NotionToolbarChipsComponent as typeof NotionToolbarChipsComponent & {
    dataViewSlot: "toolbar";
  };

export type { NotionToolbarChipsProps };
