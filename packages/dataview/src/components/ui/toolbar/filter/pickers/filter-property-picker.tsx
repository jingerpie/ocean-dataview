"use client";

import { isWhereExpression, isWhereRule } from "@sparkyidea/shared/types";
import { createRuleFromProperty } from "@sparkyidea/shared/utils";
import { ChevronDownIcon, ListFilterIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useAdvanceFilterBuilder,
  useFilterParams,
  useSimpleFilterChip,
} from "../../../../../hooks";
import type { PropertyMeta } from "../../../../../types";
import { Button } from "../../../button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../../../command";
import { Popover, PopoverContent, PopoverTrigger } from "../../../popover";
import { PropertyIcon } from "../../../property-icon";

interface FilterPropertyPickerProps {
  /**
   * Advanced mode (for use inside advanced filter builder):
   * - `true` - No "Add advanced filter" button, shows all properties
   * - `false` - Shows "Add advanced filter" button, excludes already-used properties
   */
  advance?: boolean;
  /**
   * Override default click behavior. If provided, replaces default action (open dropdown).
   * Use this to customize what happens when the trigger is clicked.
   */
  onClick?: () => void;
  /** Callback when property changes (for rule variant only) */
  onPropertyChange?: (property: PropertyMeta) => void;
  /** Available properties to filter by */
  properties: readonly PropertyMeta[];
  /** Currently selected property (for rule variant only) */
  value?: PropertyMeta;
  /**
   * Trigger variant:
   * - `default` - Filter icon with "Filter" label, outline button
   * - `icon` - Filter icon only, ghost button
   * - `rule` - Shows selected property value (for changing property in existing rule)
   * - `inline` - Filter icon only, ghost button, no label
   */
  variant?: "default" | "icon" | "rule" | "inline";
}

/**
 * Filter property picker with Popover + Command.
 *
 * Uses `useFilterParams()` and `useAdvanceFilterBuilder()` internally.
 *
 * Trigger Variants:
 * - `default` - Filter icon with "Filter" label, outline button
 * - `icon` - Filter icon only, ghost button
 * - `rule` - Shows selected property value (for existing filter rules)
 *
 * Content Modes:
 * - `advance=false` (default) - Shows "Add advanced filter" button, excludes already-used properties
 * - `advance=true` - No "Add advanced filter" button, shows all properties
 *
 * Click Behavior:
 * - If `onClick` is NOT provided → default behavior (open dropdown)
 * - If `onClick` IS provided → overrides default, calls provided function instead
 */
function FilterPropertyPicker({
  properties,
  onClick,
  variant = "default",
  advance = false,
  value,
  onPropertyChange,
}: FilterPropertyPickerProps) {
  const [open, setOpen] = useState(false);
  const { filter, setFilter } = useFilterParams();
  const openAdvancedFilterBuilder = useAdvanceFilterBuilder(
    (state) => state.open
  );
  const openFilterChip = useSimpleFilterChip((state) => state.open);

  // Check if advanced filter already exists (nested WhereExpression at root)
  const hasAdvancedFilter = useMemo(() => {
    if (!filter) {
      return false;
    }
    return filter.some(isWhereExpression);
  }, [filter]);

  // Compute property IDs already used in filter (for non-advance mode)
  const usedPropertyIds = useMemo(() => {
    if (advance || !filter) {
      return [];
    }
    return filter.filter(isWhereRule).map((rule) => rule.property);
  }, [advance, filter]);

  // Filter out:
  // 1. Formula properties (can't filter computed values at database level)
  // 2. Properties with enableFilter: false
  // 3. Already-used properties (only when not in advance mode)
  // Then sort alphabetically by label (like Notion)
  const availableProperties = useMemo(() => {
    // First, filter out formula properties and properties with enableFilter: false
    const filterableProperties = properties.filter(
      (p) => p.type !== "formula" && p.enableFilter !== false
    );

    const filtered = advance
      ? filterableProperties
      : filterableProperties.filter(
          (p) => !usedPropertyIds.includes(String(p.id))
        );

    // Sort alphabetically by label (like Notion)
    return [...filtered].sort((a, b) =>
      (a.label ?? String(a.id)).localeCompare(b.label ?? String(b.id))
    );
  }, [advance, properties, usedPropertyIds]);

  // Find matching property from items for rule variant
  const selectedProperty = value
    ? properties.find((p) => p.id === value.id)
    : undefined;

  // Handle property selection
  const handleSelect = (property: PropertyMeta) => {
    // For rule variant, just notify parent
    if (variant === "rule") {
      onPropertyChange?.(property);
      setOpen(false);
      return;
    }

    const rule = createRuleFromProperty(property);

    // Add to existing filter or create new
    if (filter) {
      setFilter([...filter, rule]);
    } else {
      setFilter([rule]);
    }

    setOpen(false);

    // Auto-open the filter chip for the newly added filter
    openFilterChip(String(property.id));
  };

  // Handle open advanced filter
  const handleAdvancedFilter = () => {
    setOpen(false);

    // Create advanced filter structure if it doesn't exist
    const firstProperty = properties[0];
    if (firstProperty && !hasAdvancedFilter) {
      const rule = createRuleFromProperty(firstProperty);

      if (filter) {
        // Has existing simple filters, add advanced filter alongside
        setFilter([...filter, { and: [rule] }]);
      } else {
        // No filter exists, create new with advanced filter structure
        setFilter([{ and: [rule] }]);
      }
    }

    openAdvancedFilterBuilder();
  };

  // Render trigger based on variant
  const renderTrigger = () => {
    if (variant === "rule") {
      return (
        <PopoverTrigger render={<Button variant="outline" />}>
          {selectedProperty ? (
            <>
              <PropertyIcon type={selectedProperty.type} />
              <span>
                {selectedProperty.label ?? String(selectedProperty.id)}
              </span>
            </>
          ) : (
            "Select property..."
          )}
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
        </PopoverTrigger>
      );
    }

    if (variant === "icon") {
      return (
        <PopoverTrigger render={<Button size="icon" variant="ghost" />}>
          <ListFilterIcon />
        </PopoverTrigger>
      );
    }

    if (variant === "inline") {
      return (
        <PopoverTrigger render={<Button size="sm" variant="ghost" />}>
          <PlusIcon />
          <span>Filter</span>
        </PopoverTrigger>
      );
    }

    // default variant
    return (
      <PopoverTrigger render={<Button variant="outline" />}>
        <ListFilterIcon />
        <span>Filter</span>
      </PopoverTrigger>
    );
  };

  // When onClick is provided for non-rule variants, render standalone button
  // This completely bypasses Popover behavior - clicking only calls onClick
  if (onClick && variant !== "rule") {
    if (variant === "icon") {
      return (
        <Button onClick={onClick} size="icon" variant="ghost">
          <ListFilterIcon />
        </Button>
      );
    }
    // default variant
    return (
      <Button onClick={onClick} variant="outline">
        <ListFilterIcon />
        <span>Filter</span>
      </Button>
    );
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      {renderTrigger()}
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
                  value={property.label ?? String(property.id)}
                >
                  <PropertyIcon type={property.type} />
                  <span className="truncate">
                    {property.label ?? String(property.id)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {!advance && (
            <>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem onSelect={handleAdvancedFilter}>
                  <PlusIcon />
                  <span>Add advanced filter</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { FilterPropertyPicker, type FilterPropertyPickerProps };
