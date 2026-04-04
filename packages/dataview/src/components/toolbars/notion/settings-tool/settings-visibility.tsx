"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useToolbarContext } from "../../../../lib/providers/toolbar-context";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../../ui/command";

interface SettingsVisibilityProps {
  /** Property IDs to exclude from the list */
  excludedPropertyIds?: string[];
}

/**
 * Property visibility section for settings panel.
 *
 * Reads properties and visibility state from ToolbarContext.
 */
function SettingsVisibility({
  excludedPropertyIds = [],
}: SettingsVisibilityProps) {
  const { properties, propertyVisibility, toggleProperty } =
    useToolbarContext();

  // Filter out hidden and excluded properties
  const availableProperties = properties.filter(
    (property) =>
      property.hidden !== true &&
      !excludedPropertyIds.includes(String(property.id))
  );

  return (
    <Command className="p-0">
      <CommandInput placeholder="Search properties..." />
      <CommandEmpty>No properties found.</CommandEmpty>
      <CommandList>
        <CommandGroup>
          {availableProperties.map((property) => {
            const propertyId = String(property.id);
            const isVisible = propertyVisibility.includes(propertyId);
            return (
              <CommandItem
                key={propertyId}
                onSelect={() => toggleProperty(propertyId)}
                value={String(property.name ?? property.id)}
              >
                <span className="flex-1 truncate">
                  {property.name ?? String(property.id)}
                </span>
                {isVisible ? <EyeIcon /> : <EyeOffIcon />}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export { SettingsVisibility, type SettingsVisibilityProps };
