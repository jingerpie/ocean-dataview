"use client";

import { EyeIcon, EyeOffIcon, Settings2 } from "lucide-react";
import { useState } from "react";
import { useDataViewContext } from "../../../lib/providers/data-view-context";
import type { PropertyMeta } from "../../../types";
import { Button } from "../button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../command";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";

export interface VisibilityProps {
  /**
   * Trigger variant:
   * - `default` - Icon + text, outline button
   * - `icon` - Icon only, ghost button
   */
  variant?: "default" | "icon";
}

/**
 * Property visibility picker with Popover + Command.
 *
 * Trigger Variants:
 * - `default` - Settings icon with "Properties" label, outline button
 * - `icon` - Settings icon only, ghost button
 */
export function Visibility({ variant = "default" }: VisibilityProps = {}) {
  const [open, setOpen] = useState(false);
  const {
    propertyMetas,
    propertyVisibility,
    excludedPropertyIds,
    setPropertyVisibility,
  } = useDataViewContext();

  // Filter out:
  // 1. Properties with hidden: true
  // 2. Excluded property IDs (e.g., grouped column)
  const availableProperties = propertyMetas.filter(
    (property) =>
      property.hidden !== true &&
      !excludedPropertyIds.some((id) => id === property.id)
  );

  // Toggle a property's visibility
  const toggleProperty = (property: PropertyMeta) => {
    const propertyId = String(property.id);
    const isVisible = propertyVisibility.includes(propertyId);

    if (isVisible) {
      // Remove from visibility
      setPropertyVisibility(
        propertyVisibility.filter((id) => id !== propertyId)
      );
    } else {
      // Add to visibility
      setPropertyVisibility([...propertyVisibility, propertyId]);
    }
  };

  // Render trigger based on variant
  const renderTrigger = () => {
    if (variant === "icon") {
      return (
        <PopoverTrigger render={<Button size="icon" variant="ghost" />}>
          <Settings2 />
        </PopoverTrigger>
      );
    }

    // default variant
    return (
      <PopoverTrigger render={<Button variant="outline" />}>
        <Settings2 />
        <span>Properties</span>
      </PopoverTrigger>
    );
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      {renderTrigger()}
      <PopoverContent align="end" className="w-48 p-0">
        <Command className="p-0">
          <CommandInput placeholder="Search columns..." />
          <CommandEmpty>No columns found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {availableProperties.map((property) => {
                const isChecked = propertyVisibility.includes(
                  String(property.id)
                );
                return (
                  <CommandItem
                    key={String(property.id)}
                    onSelect={() => toggleProperty(property)}
                    value={String(property.label ?? property.id)}
                  >
                    <span className="flex-1 truncate">
                      {property.label ?? String(property.id)}
                    </span>
                    {isChecked ? <EyeIcon /> : <EyeOffIcon />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
