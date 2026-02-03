"use client";

import type { SortQuery } from "@sparkyidea/shared/types";
import { SortAscIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useSortParams } from "../../../../hooks";
import type { PropertyMeta } from "../../../../types";
import { Button } from "../../button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "../../combobox";
import { PropertyIcon } from "../../property-icon";

interface SortPropertyPickerProps {
  /** Available properties to sort by */
  properties: readonly PropertyMeta[];
  /**
   * Override default click behavior. If provided, replaces default action (open dropdown).
   * Use this to customize what happens when the trigger is clicked.
   */
  onClick?: () => void;
  /**
   * Trigger variant:
   * - `default` - Sort icon with "Sort" label, outline button
   * - `icon` - Sort icon only, ghost button
   */
  variant?: "default" | "icon";
}

/**
 * Sort property picker with Combobox.
 *
 * Uses `useSortParams()` internally to manage sort state.
 *
 * Trigger Variants:
 * - `default` - Sort icon with "Sort" label, outline button
 * - `icon` - Sort icon only, ghost button
 *
 * Click Behavior:
 * - If `onClick` is NOT provided → default behavior (open dropdown)
 * - If `onClick` IS provided → overrides default, calls provided function instead
 */
function SortPropertyPicker({
  properties,
  onClick,
  variant = "default",
}: SortPropertyPickerProps) {
  const [open, setOpen] = useState(false);
  const { sort: sorts, setSort } = useSortParams();

  // Filter out formula properties (can't sort computed values) and properties with enableSort: false
  const sortableProperties = useMemo(
    () =>
      properties.filter((p) => p.type !== "formula" && p.enableSort !== false),
    [properties]
  );

  // Handle property selection - adds new sort
  const handleSelect = (property: PropertyMeta) => {
    const newSort: SortQuery = {
      property: String(property.id),
      direction: "asc",
    };

    // Add to existing sorts
    setSort([...sorts, newSort]);
    setOpen(false);
  };

  // Render trigger based on variant
  const renderTrigger = () => {
    if (variant === "icon") {
      return (
        <ComboboxTrigger
          render={<Button size="icon-sm" variant="ghost" />}
          showChevron={false}
        >
          <SortAscIcon />
        </ComboboxTrigger>
      );
    }

    // default variant
    return (
      <ComboboxTrigger render={<Button size="sm" variant="outline" />}>
        <SortAscIcon />
        <span>Sort</span>
      </ComboboxTrigger>
    );
  };

  // When onClick is provided, render standalone button
  // This completely bypasses Combobox behavior - clicking only calls onClick
  if (onClick) {
    if (variant === "icon") {
      return (
        <Button onClick={onClick} size="icon-sm" variant="ghost">
          <SortAscIcon />
        </Button>
      );
    }
    // default variant
    return (
      <Button onClick={onClick} size="sm" variant="outline">
        <SortAscIcon />
        <span>Sort</span>
      </Button>
    );
  }

  return (
    <Combobox
      items={sortableProperties}
      onOpenChange={setOpen}
      onValueChange={(newValue) => {
        if (newValue) {
          handleSelect(newValue as PropertyMeta);
        }
      }}
      open={open}
    >
      {renderTrigger()}
      <ComboboxContent align="start" className="w-56">
        <ComboboxInput placeholder="Sort by..." showTrigger={false} />
        <ComboboxEmpty>No properties found.</ComboboxEmpty>
        <ComboboxList>
          {(property) => (
            <ComboboxItem key={String(property.id)} value={property}>
              <PropertyIcon type={property.type} />
              <span className="truncate">
                {property.label ?? String(property.id)}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export { SortPropertyPicker, type SortPropertyPickerProps };
