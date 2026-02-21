"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useDataViewContext } from "../../../../lib/providers";
import type { PropertyMeta } from "../../../../types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../../ui/command";

/**
 * Property visibility section for settings panel.
 *
 * Shows all available properties with toggle to show/hide.
 */
function SettingsVisibility() {
  const {
    propertyMetas,
    propertyVisibility,
    excludedPropertyIds,
    setPropertyVisibility,
  } = useDataViewContext();

  // Filter out hidden and excluded properties
  const availableProperties = propertyMetas.filter(
    (property) =>
      property.hidden !== true &&
      !excludedPropertyIds.some((id) => id === property.id)
  );

  const toggleProperty = (property: PropertyMeta) => {
    const propertyId = String(property.id);
    const isVisible = propertyVisibility.includes(propertyId);

    if (isVisible) {
      setPropertyVisibility(
        propertyVisibility.filter((id) => id !== propertyId)
      );
    } else {
      setPropertyVisibility([...propertyVisibility, propertyId]);
    }
  };

  return (
    <Command className="p-0">
      <CommandInput placeholder="Search properties..." />
      <CommandEmpty>No properties found.</CommandEmpty>
      <CommandList>
        <CommandGroup>
          {availableProperties.map((property) => {
            const isVisible = propertyVisibility.includes(String(property.id));
            return (
              <CommandItem
                key={String(property.id)}
                onSelect={() => toggleProperty(property)}
                value={String(property.label ?? property.id)}
              >
                <span className="flex-1 truncate">
                  {property.label ?? String(property.id)}
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

export { SettingsVisibility };
