"use client";

import { createRuleFromProperty } from "@sparkyidea/shared/utils";
import { PlusIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useFilterParams } from "../../../../hooks";
import type { PropertyMeta } from "../../../../types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../../command";
import { PropertyIcon } from "../../property-icon";

interface SimpleSimpleFilterPickerProps {
  /** Override addFilter function (uses useFilterParams internally if not provided) */
  addFilter?: (property: PropertyMeta) => void;
  /** Property IDs to exclude (already in use) */
  excludeIds?: string[];
  /** Callback when "Add advanced filter" is clicked */
  onAdvancedClick?: () => void;
  /** Additional callback after selecting a property */
  onSelect?: (property: PropertyMeta) => void;
  /** Available properties to filter by */
  properties: readonly PropertyMeta[];
  /** Show "Add advanced filter" option */
  showAdvancedOption?: boolean;
}

/**
 * Property picker for selecting which property to filter by.
 *
 * Uses useFilterParams() internally by default, but can receive addFilter from parent
 * to share state (avoiding unmount issues with debounced updates).
 *
 * Features:
 * - Searchable Command-based list
 * - Excludes formula/button properties (can't filter)
 * - Excludes already-used properties via excludeIds
 * - Sorted alphabetically by label
 * - Optional "Add advanced filter" option
 */
function SimpleFilterPicker({
  properties,
  excludeIds = [],
  onSelect,
  addFilter: addFilterProp,
  showAdvancedOption = false,
  onAdvancedClick,
}: SimpleSimpleFilterPickerProps) {
  const { filter, setFilter } = useFilterParams();

  // Default addFilter implementation
  const addFilterInternal = useCallback(
    (property: PropertyMeta) => {
      const rule = createRuleFromProperty(property);
      if (filter) {
        setFilter([...filter, rule]);
      } else {
        setFilter([rule]);
      }
    },
    [filter, setFilter]
  );

  const addFilter = addFilterProp ?? addFilterInternal;

  // Filter and sort properties
  const availableProperties = useMemo(() => {
    const filtered = properties.filter(
      (p) =>
        p.type !== "formula" &&
        p.type !== "button" &&
        p.enableFilter !== false &&
        !excludeIds.includes(String(p.id))
    );

    return [...filtered].sort((a, b) =>
      (a.label ?? String(a.id)).localeCompare(b.label ?? String(b.id))
    );
  }, [properties, excludeIds]);

  const handleSelect = useCallback(
    (property: PropertyMeta) => {
      addFilter(property);
      onSelect?.(property);
    },
    [addFilter, onSelect]
  );

  return (
    <Command className="p-0">
      <CommandInput placeholder="Filter by..." />
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
      {showAdvancedOption && onAdvancedClick && (
        <>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem onSelect={onAdvancedClick}>
              <PlusIcon />
              <span>Add advanced filter</span>
            </CommandItem>
          </CommandGroup>
        </>
      )}
    </Command>
  );
}

export { SimpleFilterPicker, type SimpleSimpleFilterPickerProps };
