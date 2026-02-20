"use client";

import type {
  WhereExpression,
  WhereNode,
  WhereRule,
} from "@sparkyidea/shared/types";
import { useSortParams } from "../../../hooks";
import { cn } from "../../../lib/utils";
import type { PropertyMeta } from "../../../types";
import { Button } from "../../ui/button";
import { Separator } from "../../ui/separator";
import { FilterTrigger } from "../../ui/toolbar/filter/filter-trigger";
import { SimpleFilterPicker } from "../../ui/toolbar/filter/simple-filter-picker";
import { AdvancedFilterChip } from "./advanced-filter-chip";
import { SimpleFilterChip } from "./simple-filter-chip";
import { SortChip } from "./sort-chip";

interface ChipsBarProps {
  /** Advanced filter (WhereExpression at root level) */
  advancedFilter: WhereExpression | null;
  /** Index of advancedFilter in root array */
  advancedFilterIndex: number | null;
  /** Additional class names */
  className?: string;
  /** Current filter (array of WhereNode, implicit AND) */
  filter: WhereNode[] | null;
  /** Callback when filter changes */
  onFilterChange: (filter: WhereNode[] | null) => void;
  /** Callback to reset all filters and sorts (removes from URL) */
  onReset: () => void;
  /** Available properties */
  properties: readonly PropertyMeta[];
  /** Total rule count in advanced filter */
  ruleCount: number;
  /** Simple filter rules (WhereRules at root level) */
  simpleFilterConditions: Array<{ condition: WhereRule; index: number }>;
}

/**
 * Bar displaying active sort/filter chips.
 *
 * Display Order (Fixed):
 * 1. Sort chip (multi-sort with drag-and-drop)
 * 2. Advanced filter chip (if exists)
 * 3. Simple filter chips (in array order)
 * 4. "+ Filter" button
 */
export function ChipsBar({
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
  const { sort: sorts } = useSortParams();

  const handleRuleChange = (index: number, newRule: WhereRule) => {
    if (!filter) {
      return;
    }
    const newFilter = [...filter];
    newFilter[index] = newRule;
    onFilterChange(newFilter);
  };

  const handleRuleRemove = (index: number) => {
    if (!filter) {
      return;
    }
    const newFilter = filter.filter((_, i) => i !== index);
    onFilterChange(newFilter.length > 0 ? newFilter : null);
  };

  const handleAddToAdvanced = (index: number, rule: WhereRule) => {
    if (!filter) {
      return;
    }

    const items = [...filter];
    items.splice(index, 1);

    if (advancedFilter && advancedFilterIndex !== null) {
      const advancedItems = advancedFilter.and ?? advancedFilter.or ?? [];
      const newAdvanced: WhereExpression = advancedFilter.and
        ? { and: [...advancedItems, rule] }
        : { or: [...advancedItems, rule] };
      items[advancedFilterIndex] = newAdvanced;
    } else {
      const newAdvanced: WhereExpression = { and: [rule] };
      items.unshift(newAdvanced);
    }

    onFilterChange(items.length > 0 ? items : null);
  };

  const handleAdvancedFilterChange = (newAdvanced: WhereNode | null) => {
    if (!filter || advancedFilterIndex === null) {
      if (newAdvanced) {
        onFilterChange([newAdvanced]);
      } else {
        onFilterChange(null);
      }
      return;
    }

    const items = [...filter];

    if (newAdvanced === null) {
      items.splice(advancedFilterIndex, 1);
      onFilterChange(items.length > 0 ? items : null);
    } else {
      items[advancedFilterIndex] = newAdvanced;
      onFilterChange(items);
    }
  };

  return (
    <div className={cn("flex items-start gap-1.5", className)}>
      <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
        {/* 1. Sort Chip */}
        {sorts.length > 0 && <SortChip properties={properties} />}

        {/* Separator between sorts and filters */}
        {sorts.length > 0 &&
          (advancedFilter || simpleFilterConditions.length > 0) && (
            <Separator orientation="vertical" />
          )}

        <div className="flex items-center gap-1.5">
          {/* 2. Advanced Filter Chip */}
          {advancedFilter && (
            <AdvancedFilterChip
              filter={advancedFilter}
              onFilterChange={handleAdvancedFilterChange}
              properties={properties}
              ruleCount={ruleCount}
            />
          )}

          {/* 3. Simple Filter Chips */}
          {simpleFilterConditions.map(({ condition, index }) => {
            const property = properties.find(
              (p) => String(p.id) === condition.property
            );
            if (!property) {
              return null;
            }

            return (
              <SimpleFilterChip
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
          <FilterTrigger variant="add">
            <SimpleFilterPicker
              excludeIds={simpleFilterConditions.map(
                ({ condition }) => condition.property
              )}
              properties={properties}
            />
          </FilterTrigger>
        </div>
      </div>

      {/* 5. Reset Button */}
      <Button
        className="ml-auto shrink-0"
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
