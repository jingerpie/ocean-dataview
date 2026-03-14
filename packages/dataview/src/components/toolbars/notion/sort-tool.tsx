"use client";

import { SortAscIcon } from "lucide-react";
import { useState } from "react";
import { useSortBuilder, useSortParams } from "../../../hooks";
import type { PropertyMeta } from "../../../types";
import { Button } from "../../ui/button";
import { SortPicker } from "../../ui/sort/sort-picker";
import { SortTrigger } from "../../ui/sort/sort-trigger";

interface SortToolProps {
  /** Callback when sorts exist and icon is clicked (toggle row2) */
  onToggle?: () => void;
  /** Available properties to sort by */
  properties: readonly PropertyMeta[];
}

/**
 * Sort toolbar button.
 *
 * Behavior:
 * - If sorts exist → clicking toggles row2 (calls onToggle)
 * - If no sorts → clicking opens picker to add first sort
 */
function SortTool({ properties, onToggle }: SortToolProps) {
  const { sort: sorts } = useSortParams();
  const { open: openSortBuilder } = useSortBuilder();
  const [pickerOpen, setPickerOpen] = useState(false);

  // If sorts exist, render a plain button that toggles row2
  if (sorts.length > 0 && onToggle) {
    return (
      <Button onClick={onToggle} size="icon" variant="ghost">
        <SortAscIcon />
      </Button>
    );
  }

  // No sorts - render trigger with picker
  // SortPicker handles addSort internally, callback for additional action
  return (
    <SortTrigger onOpenChange={setPickerOpen} open={pickerOpen} variant="icon">
      <SortPicker
        onAddSort={() => {
          setPickerOpen(false);
          openSortBuilder();
        }}
        properties={properties}
      />
    </SortTrigger>
  );
}

export { SortTool, type SortToolProps };
