"use client";

import { useCallback, useMemo } from "react";
import { useSortParams } from "../../../../hooks";
import type { PropertyMeta } from "../../../../types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../command";
import { PropertyIcon } from "../../property-icon";

interface SortPickerProps {
  /** Additional callback after adding a sort */
  onAddSort?: (property: PropertyMeta) => void;
  /** Available properties to sort by */
  properties: readonly PropertyMeta[];
}

/**
 * Property picker for selecting which property to sort by.
 *
 * Handles add sort internally via useSortParams().
 * useDebouncedCallback flushes on unmount, so no need for parent override.
 *
 * Features:
 * - Searchable Command-based list
 * - Excludes formula/button properties (can't sort)
 * - Excludes already-used properties
 * - Sorted alphabetically by label
 */
function SortPicker({ properties, onAddSort }: SortPickerProps) {
  const { sort: sorts, addSort } = useSortParams();

  // Get already-used property IDs
  const usedPropertyIds = useMemo(() => sorts.map((s) => s.property), [sorts]);

  // Filter and sort properties
  const availableProperties = useMemo(() => {
    const filtered = properties.filter(
      (p) =>
        p.type !== "formula" &&
        p.type !== "button" &&
        p.enableSort !== false &&
        !usedPropertyIds.includes(String(p.id))
    );

    return [...filtered].sort((a, b) =>
      (a.label ?? String(a.id)).localeCompare(b.label ?? String(b.id))
    );
  }, [properties, usedPropertyIds]);

  const handleSelect = useCallback(
    (property: PropertyMeta) => {
      addSort(String(property.id), "asc");
      onAddSort?.(property);
    },
    [addSort, onAddSort]
  );

  return (
    <Command className="p-0">
      <CommandInput placeholder="Sort by..." />
      <CommandEmpty>No properties found.</CommandEmpty>
      <CommandList>
        <CommandGroup>
          {availableProperties.map((property) => (
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
  );
}

export { SortPicker, type SortPickerProps };
