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
  /** Override addSort function (uses useSortParams internally if not provided) */
  addSort?: (prop: string, direction?: "asc" | "desc") => void;
  /** Additional callback after selecting a property */
  onSelect?: (property: PropertyMeta) => void;
  /** Available properties to sort by */
  properties: readonly PropertyMeta[];
}

/**
 * Property picker for selecting which property to sort by.
 *
 * Uses useSortParams() internally by default, but can receive addSort from parent
 * to share state (avoiding unmount issues with debounced updates).
 *
 * Features:
 * - Searchable Command-based list
 * - Excludes formula/button properties (can't sort)
 * - Excludes already-used properties
 * - Sorted alphabetically by label
 */
function SortPicker({
  properties,
  onSelect,
  addSort: addSortProp,
}: SortPickerProps) {
  const { sort: sorts, addSort: addSortInternal } = useSortParams();
  const addSort = addSortProp ?? addSortInternal;

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
      onSelect?.(property);
    },
    [addSort, onSelect]
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
