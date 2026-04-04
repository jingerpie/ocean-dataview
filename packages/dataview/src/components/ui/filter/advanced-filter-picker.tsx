"use client";

import { ChevronDownIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { PropertyMeta } from "../../../types/property.type";
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
import { PropertyIcon } from "../property-icon";

interface AdvancedFilterPickerProps {
  /** Callback when property changes */
  onPropertyChange: (property: PropertyMeta) => void;
  /** Available properties to choose from */
  properties: readonly PropertyMeta[];
  /** Currently selected property */
  value?: PropertyMeta;
}

/**
 * Property picker for changing the property of an existing filter rule.
 * Shows a dropdown with all filterable properties sorted alphabetically.
 */
function AdvancedFilterPicker({
  properties,
  value,
  onPropertyChange,
}: AdvancedFilterPickerProps) {
  const [open, setOpen] = useState(false);

  // Filter out formula/button properties and sort alphabetically
  const availableProperties = useMemo(() => {
    const filtered = properties.filter(
      (p) =>
        p.type !== "formula" && p.type !== "button" && p.enableFilter !== false
    );

    return [...filtered].sort((a, b) =>
      (a.name ?? String(a.id)).localeCompare(b.name ?? String(b.id))
    );
  }, [properties]);

  const handleSelect = (property: PropertyMeta) => {
    onPropertyChange(property);
    setOpen(false);
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger render={<Button variant="outline" />}>
        {value ? (
          <>
            <PropertyIcon type={value.type} />
            <span>{value.name ?? String(value.id)}</span>
          </>
        ) : (
          "Select property..."
        )}
        <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <Command className="p-0">
          <CommandInput placeholder="Filter by..." />
          <CommandList>
            <CommandEmpty>No properties found.</CommandEmpty>
            <CommandGroup>
              {availableProperties.map((property) => (
                <CommandItem
                  key={String(property.id)}
                  onSelect={() => handleSelect(property)}
                  value={property.name ?? String(property.id)}
                >
                  <PropertyIcon type={property.type} />
                  <span className="truncate">
                    {property.name ?? String(property.id)}
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

export { AdvancedFilterPicker, type AdvancedFilterPickerProps };
