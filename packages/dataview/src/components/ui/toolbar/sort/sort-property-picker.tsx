"use client";

import type { SortQuery } from "@sparkyidea/shared/types";
import { SortAscIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useSortParams } from "../../../../hooks";
import type { PropertyMeta } from "../../../../types";
import { Button } from "../../button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../command";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover";
import { PropertyIcon } from "../../property-icon";

interface SortPropertyPickerProps {
  /**
   * Override default click behavior. If provided, replaces default action (open dropdown).
   * Use this to customize what happens when the trigger is clicked.
   */
  onClick?: () => void;
  /** Available properties to sort by */
  properties: readonly PropertyMeta[];
  /**
   * Trigger variant:
   * - `default` - Sort icon with "Sort" label, outline button
   * - `icon` - Sort icon only, ghost button
   */
  variant?: "default" | "icon";
}

/**
 * Sort property picker with Popover + Command.
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

  // Filter out formula/button properties (can't sort computed values or actions) and properties with enableSort: false
  // Then sort alphabetically by label (like Notion)
  const sortableProperties = useMemo(() => {
    const filtered = properties.filter(
      (p) =>
        p.type !== "formula" && p.type !== "button" && p.enableSort !== false
    );
    // Sort alphabetically by label (like Notion)
    return [...filtered].sort((a, b) =>
      (a.label ?? String(a.id)).localeCompare(b.label ?? String(b.id))
    );
  }, [properties]);

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
        <PopoverTrigger render={<Button size="icon" variant="ghost" />}>
          <SortAscIcon />
        </PopoverTrigger>
      );
    }

    // default variant
    return (
      <PopoverTrigger render={<Button variant="outline" />}>
        <SortAscIcon />
        <span>Sort</span>
      </PopoverTrigger>
    );
  };

  // When onClick is provided, render standalone button
  // This completely bypasses Popover behavior - clicking only calls onClick
  if (onClick) {
    if (variant === "icon") {
      return (
        <Button onClick={onClick} size="icon" variant="ghost">
          <SortAscIcon />
        </Button>
      );
    }
    // default variant
    return (
      <Button onClick={onClick} variant="outline">
        <SortAscIcon />
        <span>Sort</span>
      </Button>
    );
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      {renderTrigger()}
      <PopoverContent align="start" className="w-56 p-0">
        <Command className="p-0">
          <CommandInput placeholder="Sort by..." />
          <CommandEmpty>No properties found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {sortableProperties.map((property) => (
                <CommandItem
                  key={String(property.id)}
                  onSelect={() => handleSelect(property)}
                  value={String(property.label ?? property.id)}
                >
                  <PropertyIcon type={property.type} />
                  <span className="truncate">
                    {property.label ?? String(property.id)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { SortPropertyPicker, type SortPropertyPickerProps };
