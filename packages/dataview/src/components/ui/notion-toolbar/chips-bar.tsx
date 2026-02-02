"use client";

import type {
  SortQuery,
  WhereExpression,
  WhereNode,
  WhereRule,
} from "@ocean-dataview/shared/types";
import { cn } from "../../../lib/utils";
import type { PropertyMeta } from "../../../types";
import { Button } from "../button";
import {
  AdvancedFilterChip,
  FilterChip,
  FilterPropertyPicker,
} from "../toolbar/filter";
import { SortChip } from "../toolbar/sort";

interface ChipsBarProps {
  /** Current sorts (multiple sorts supported) */
  sorts: SortQuery[];
  /** Callback when sorts change */
  onSortsChange: (sorts: SortQuery[]) => void;
  /** Current filter (array of WhereNode, implicit AND) */
  filter: WhereNode[] | null;
  /** Callback when filter changes */
  onFilterChange: (filter: WhereNode[] | null) => void;
  /** Callback to reset all filters and sorts (removes from URL) */
  onReset: () => void;
  /** Available properties */
  properties: readonly PropertyMeta[];
  /** Advanced filter (WhereExpression at root level) */
  advancedFilter: WhereExpression | null;
  /** Index of advancedFilter in root array */
  advancedFilterIndex: number | null;
  /** Simple filter rules (WhereRules at root level) */
  simpleFilterConditions: Array<{ condition: WhereRule; index: number }>;
  /** Total rule count in advanced filter */
  ruleCount: number;
  /** Additional class names */
  className?: string;
}

/**
 * Bar displaying active sort/filter chips.
 *
 * Display Order (Fixed):
 * 1. Sort list (multi-sort with drag-and-drop)
 * 2. Advanced filter chip (if exists)
 * 3. Simple filter chips (in array order)
 * 4. "+ Filter" button
 */
export function ChipsBar({
  sorts,
  onSortsChange,
  filter,
  onFilterChange,
  onReset,
  properties,
  advancedFilter,
  advancedFilterIndex,
  simpleFilterConditions,
  ruleCount,
  className,
}: ChipsBarProps) {
  // Handle updating a simple filter rule
  const handleRuleChange = (index: number, newRule: WhereRule) => {
    if (!filter) {
      return;
    }
    const newFilter = [...filter];
    newFilter[index] = newRule;
    onFilterChange(newFilter);
  };

  // Handle removing a simple filter rule
  const handleRuleRemove = (index: number) => {
    if (!filter) {
      return;
    }
    const newFilter = filter.filter((_, i) => i !== index);
    onFilterChange(newFilter.length > 0 ? newFilter : null);
  };

  // Handle adding a simple rule to advanced filter
  const handleAddToAdvanced = (index: number, rule: WhereRule) => {
    if (!filter) {
      return;
    }

    const items = [...filter];

    // Remove the rule from root level
    items.splice(index, 1);

    if (advancedFilter && advancedFilterIndex !== null) {
      // Add to existing advanced filter
      const advancedItems = advancedFilter.and ?? advancedFilter.or ?? [];
      const newAdvanced: WhereExpression = advancedFilter.and
        ? { and: [...advancedItems, rule] }
        : { or: [...advancedItems, rule] };
      items[advancedFilterIndex] = newAdvanced;
    } else {
      // Create new advanced filter with wrapped structure
      const newAdvanced: WhereExpression = { and: [rule] };
      items.unshift(newAdvanced); // Add at beginning
    }

    onFilterChange(items.length > 0 ? items : null);
  };

  // Handle advanced filter changes
  const handleAdvancedFilterChange = (newAdvanced: WhereNode | null) => {
    if (!filter || advancedFilterIndex === null) {
      // No existing filter or advanced filter - set as new root
      if (newAdvanced) {
        onFilterChange([newAdvanced]);
      } else {
        onFilterChange(null);
      }
      return;
    }

    const items = [...filter];

    if (newAdvanced === null) {
      // Remove advanced filter
      items.splice(advancedFilterIndex, 1);
      onFilterChange(items.length > 0 ? items : null);
    } else {
      // Update advanced filter at its index
      items[advancedFilterIndex] = newAdvanced;
      onFilterChange(items);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto",
        "fade-in slide-in-from-top-1 animate-in duration-150",
        className
      )}
    >
      {/* 1. Sort Chip (multi-sort with drag-and-drop) */}
      {sorts.length > 0 && (
        <SortChip
          onSortsChange={onSortsChange}
          properties={properties}
          sorts={sorts}
        />
      )}

      {/* 2. Advanced Filter Chip (if exists) */}
      {advancedFilter && (
        <AdvancedFilterChip
          filter={advancedFilter}
          onFilterChange={handleAdvancedFilterChange}
          properties={properties}
          ruleCount={ruleCount}
        />
      )}

      {/* 3. Simple Filter Chips (in array order) */}
      {simpleFilterConditions.map(({ condition, index }) => {
        const property = properties.find(
          (p) => String(p.id) === condition.property
        );
        if (!property) {
          return null;
        }

        return (
          <FilterChip
            key={`filter-${condition.property}-${index}`}
            onAddToAdvanced={() => handleAddToAdvanced(index, condition)}
            onRemove={() => handleRuleRemove(index)}
            onRuleChange={(newRule) => handleRuleChange(index, newRule)}
            property={property}
            rule={condition}
            variant="detailed"
          />
        );
      })}

      {/* 4. + Filter Button */}
      <FilterPropertyPicker properties={properties} variant="inline" />

      {/* 5. Reset Button - Removes filter/sort from URL to restore defaults */}
      <Button
        className="sticky right-0 ml-auto shrink-0 bg-background text-muted-foreground hover:text-foreground"
        onClick={onReset}
        size="sm"
        variant="ghost"
      >
        Reset
      </Button>
    </div>
  );
}

export type { ChipsBarProps };
