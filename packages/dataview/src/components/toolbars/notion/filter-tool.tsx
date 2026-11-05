"use client";

import { ListFilterIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { flushSync } from "react-dom";
import { useFilterParams } from "../../../hooks/use-filter-params";
import { useSimpleFilterChip } from "../../../hooks/use-simple-filter-chip";
import type { PropertyMeta } from "../../../types/property.type";
import { createRuleFromProperty } from "../../../utils/filter-variant";
import { Button } from "../../ui/button";
import { FilterTrigger } from "../../ui/filter/filter-trigger";
import { SimpleFilterPicker } from "../../ui/filter/simple-filter-picker";

interface FilterToolProps {
  /** Callback when filters exist and icon is clicked (toggle row2) */
  onToggle?: () => void;
  /** Available properties to filter by */
  properties: readonly PropertyMeta[];
}

/**
 * Filter toolbar button.
 *
 * Behavior:
 * - If filters exist → clicking toggles row2 (calls onToggle)
 * - If no filters → clicking opens picker to add first filter
 */
function FilterTool({ properties, onToggle }: FilterToolProps) {
  const { filter, addFilter } = useFilterParams();
  const { open: openFilterChip } = useSimpleFilterChip();
  const [pickerOpen, setPickerOpen] = useState(false);

  const hasFilters = filter && filter.length > 0;

  // If filters exist, render a plain button that toggles row2
  if (hasFilters && onToggle) {
    return (
      <Button onClick={onToggle} size="icon" variant="ghost">
        <ListFilterIcon />
      </Button>
    );
  }

  // Flush the close so the popover exits at its original position before the filter shifts the trigger
  const handleAddFilter = useCallback(
    (property: PropertyMeta) => {
      flushSync(() => {
        setPickerOpen(false);
      });
      const rule = createRuleFromProperty(property);
      addFilter(rule);
      openFilterChip(String(property.id));
    },
    [addFilter, openFilterChip]
  );

  return (
    <FilterTrigger
      onOpenChange={setPickerOpen}
      open={pickerOpen}
      variant="icon"
    >
      <SimpleFilterPicker
        onAddFilter={handleAddFilter}
        properties={properties}
      />
    </FilterTrigger>
  );
}

export { FilterTool, type FilterToolProps };
