"use client";

import { useAdvanceFilterBuilder } from "../../../hooks";
import type { PropertyMeta, WhereExpression, WhereNode } from "../../../types";
import { AdvancedFilterEditor } from "../../ui/filter/advanced-filter-editor";
import { FilterTrigger } from "../../ui/filter/filter-trigger";

interface AdvancedFilterChipProps {
  /** The compound filter (AND/OR group) */
  filter: WhereExpression;
  /** Callback when filter changes */
  onFilterChange: (filter: WhereNode | null) => void;
  /** Available properties */
  properties: readonly PropertyMeta[];
  /** Total number of rules in the filter */
  ruleCount: number;
}

/**
 * Advanced filter chip for the chips bar.
 *
 * Shows "N rules" chip that opens the full filter builder.
 * Uses Zustand store for popover state coordination with toolbar buttons.
 */
function AdvancedFilterChip({
  filter,
  properties,
  onFilterChange,
  ruleCount,
}: AdvancedFilterChipProps) {
  const { isOpen, setOpen } = useAdvanceFilterBuilder();

  const handleFilterChange = (newFilter: WhereExpression) => {
    onFilterChange(newFilter);
  };

  const handleDeleteAll = () => {
    onFilterChange(null);
    setOpen(false);
  };

  return (
    <FilterTrigger
      count={ruleCount}
      onOpenChange={setOpen}
      open={isOpen}
      variant="count"
    >
      <AdvancedFilterEditor
        filter={filter}
        onDeleteAll={handleDeleteAll}
        onFilterChange={handleFilterChange}
        properties={properties}
      />
    </FilterTrigger>
  );
}

export { AdvancedFilterChip, type AdvancedFilterChipProps };
