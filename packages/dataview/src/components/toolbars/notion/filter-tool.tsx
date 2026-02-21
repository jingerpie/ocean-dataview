"use client";

import { ListFilterIcon } from "lucide-react";
import { useState } from "react";
import { useFilterParams, useSimpleFilterChip } from "../../../hooks";
import type { PropertyMeta } from "../../../types";
import { Button } from "../../ui/button";
import { FilterTrigger } from "../../ui/toolbar/filter/filter-trigger";
import { SimpleFilterPicker } from "../../ui/toolbar/filter/simple-filter-picker";

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
  const { filter } = useFilterParams();
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

  // No filters - render trigger with picker
  // SimpleFilterPicker handles setFilter internally
  const handleAddFilter = (property: PropertyMeta) => {
    setPickerOpen(false);
    openFilterChip(String(property.id));
  };

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
