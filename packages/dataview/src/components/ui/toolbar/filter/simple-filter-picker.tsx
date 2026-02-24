"use client";

import { isWhereRule } from "@sparkyidea/shared/types";
import { PlusIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useAdvanceFilterBuilder, useFilterParams } from "../../../../hooks";
import { createRuleFromProperty } from "../../../../lib/utils/filter-variant";
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

interface SimpleFilterPickerProps {
  /** Additional callback after adding filter */
  onAddFilter?: (property: PropertyMeta) => void;
  /** Additional callback after adding advanced filter */
  onAdvancedClick?: () => void;
  /** Available properties to filter by */
  properties: readonly PropertyMeta[];
}

/**
 * Property picker for selecting which property to filter by.
 *
 * Handles internally:
 * - Add filter: Creates rule from property, adds to filter array
 * - Add advanced filter: Creates { and: [rule] } with first property, opens builder
 *
 * Features:
 * - Searchable Command-based list
 * - Excludes formula/button properties (can't filter)
 * - Excludes already-used simple filter properties (computed internally)
 * - Sorted alphabetically by label
 */
function SimpleFilterPicker({
  properties,
  onAddFilter,
  onAdvancedClick,
}: SimpleFilterPickerProps) {
  const { filter, addFilter } = useFilterParams();
  const { open: openAdvancedFilter } = useAdvanceFilterBuilder();

  // Get used property IDs from current simple filters
  const usedPropertyIds = useMemo(() => {
    if (!filter) {
      return [];
    }
    return filter.filter(isWhereRule).map((rule) => rule.property);
  }, [filter]);

  // Filter and sort properties (excludes already-used simple filter properties)
  const availableProperties = useMemo(() => {
    const filtered = properties.filter(
      (p) =>
        p.type !== "formula" &&
        p.type !== "button" &&
        p.enableFilter !== false &&
        !usedPropertyIds.includes(String(p.id))
    );

    return [...filtered].sort((a, b) =>
      (a.label ?? String(a.id)).localeCompare(b.label ?? String(b.id))
    );
  }, [properties, usedPropertyIds]);

  // Add filter rule for selected property - uses immediate addFilter
  const handleAddFilter = useCallback(
    (property: PropertyMeta) => {
      const rule = createRuleFromProperty(property);
      addFilter(rule);
      onAddFilter?.(property);
    },
    [addFilter, onAddFilter]
  );

  // Add advanced filter with initial rule from first property, then open the editor
  // Note: Advanced filters can use any property (no excludeIds check)
  const handleAdvancedClick = useCallback(() => {
    const firstProperty = properties.find(
      (p) =>
        p.type !== "formula" && p.type !== "button" && p.enableFilter !== false
    );
    if (!firstProperty) {
      return;
    }
    const rule = createRuleFromProperty(firstProperty);
    const advancedFilter = { and: [rule] };
    addFilter(advancedFilter);
    openAdvancedFilter();
    onAdvancedClick?.();
  }, [properties, addFilter, openAdvancedFilter, onAdvancedClick]);

  return (
    <Command className="p-0">
      <CommandInput placeholder="Filter by..." />
      <CommandEmpty>No properties found.</CommandEmpty>
      <CommandList>
        <CommandGroup>
          {availableProperties.map((property) => (
            <CommandItem
              key={String(property.id)}
              onSelect={() => handleAddFilter(property)}
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
      <CommandSeparator />
      <CommandGroup>
        <CommandItem onSelect={handleAdvancedClick}>
          <PlusIcon />
          <span>Add advanced filter</span>
        </CommandItem>
      </CommandGroup>
    </Command>
  );
}

export { SimpleFilterPicker, type SimpleFilterPickerProps };
