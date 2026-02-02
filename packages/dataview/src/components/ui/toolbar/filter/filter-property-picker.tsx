"use client";

import { isWhereExpression, isWhereRule } from "@ocean-dataview/shared/types";
import { createRuleFromProperty } from "@ocean-dataview/shared/utils";
import { ListFilterIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useAdvanceFilterBuilder,
  useFilterParams,
  useSimpleFilterChip,
} from "../../../../hooks";
import type { PropertyMeta } from "../../../../types";
import { Button } from "../../button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
} from "../../combobox";
import { PropertyIcon } from "../../property-icon";

interface FilterPropertyPickerProps {
  /** Available properties to filter by */
  properties: readonly PropertyMeta[];
  /**
   * Override default click behavior. If provided, replaces default action (open dropdown).
   * Use this to customize what happens when the trigger is clicked.
   */
  onClick?: () => void;
  /**
   * Trigger variant:
   * - `default` - Filter icon with "Filter" label, outline button
   * - `icon` - Filter icon only, ghost button
   * - `rule` - Shows selected property value (for changing property in existing rule)
   * - `inline` - Filter icon only, ghost button, no label
   */
  variant?: "default" | "icon" | "rule" | "inline";
  /**
   * Advanced mode (for use inside advanced filter builder):
   * - `true` - No "Add advanced filter" button, shows all properties
   * - `false` - Shows "Add advanced filter" button, excludes already-used properties
   */
  advance?: boolean;
  /** Currently selected property (for rule variant only) */
  value?: PropertyMeta;
  /** Callback when property changes (for rule variant only) */
  onPropertyChange?: (property: PropertyMeta) => void;
}

/**
 * Filter property picker with Combobox.
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
  const availableProperties = useMemo(() => {
    // First, filter out formula properties and properties with enableFilter: false
    const filterableProperties = properties.filter(
      (p) => p.type !== "formula" && p.enableFilter !== false
    );

    if (advance) {
      return filterableProperties;
    }
    return filterableProperties.filter(
      (p) => !usedPropertyIds.includes(String(p.id))
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
        <ComboboxTrigger render={<Button size="sm" variant="outline" />}>
          <ComboboxValue>
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
          </ComboboxValue>
        </ComboboxTrigger>
      );
    }

    if (variant === "icon") {
      return (
        <ComboboxTrigger
          render={<Button size="icon-sm" variant="ghost" />}
          showChevron={false}
        >
          <ListFilterIcon />
        </ComboboxTrigger>
      );
    }

    if (variant === "inline") {
      return (
        <ComboboxTrigger
          render={<Button size="sm" variant="ghost" />}
          showChevron={false}
        >
          <PlusIcon />
          <span>Filter</span>
        </ComboboxTrigger>
      );
    }

    // default variant
    return (
      <ComboboxTrigger render={<Button size="sm" variant="outline" />}>
        <ListFilterIcon />
        <span>Filter</span>
      </ComboboxTrigger>
    );
  };

  // Compute value - use null instead of undefined to keep component in controlled mode
  // Type assertion needed because base-ui Combobox has complex generic inference with union types
  const comboboxValue = (
    variant === "rule" ? (selectedProperty ?? null) : null
  ) as never;

  // When onClick is provided for non-rule variants, render standalone button
  // This completely bypasses Combobox behavior - clicking only calls onClick
  if (onClick && variant !== "rule") {
    if (variant === "icon") {
      return (
        <Button onClick={onClick} size="icon-sm" variant="ghost">
          <ListFilterIcon />
        </Button>
      );
    }
    // default variant
    return (
      <Button onClick={onClick} size="sm" variant="outline">
        <ListFilterIcon />
        <span>Filter</span>
      </Button>
    );
  }

  return (
    <Combobox
      items={availableProperties}
      onOpenChange={setOpen}
      onValueChange={(newValue) => {
        if (newValue) {
          handleSelect(newValue as PropertyMeta);
        }
      }}
      open={open}
      value={comboboxValue}
    >
      {renderTrigger()}
      <ComboboxContent align="start" className="flex w-56 flex-col">
        <ComboboxInput placeholder="Filter by..." showTrigger={false} />
        <ComboboxEmpty>No properties found.</ComboboxEmpty>
        <ComboboxList>
          {(property) => (
            <ComboboxItem key={String(property.id)} value={property}>
              <PropertyIcon type={property.type} />
              <span className="truncate">
                {property.label ?? String(property.id)}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
        {!advance && (
          <>
            <ComboboxSeparator className="my-0" />
            <Button
              className="my-1 w-full justify-start"
              onClick={handleAdvancedFilter}
              size="sm"
              variant="ghost"
            >
              <PlusIcon />
              <span>Add advanced filter</span>
            </Button>
          </>
        )}
      </ComboboxContent>
    </Combobox>
  );
}

export { FilterPropertyPicker, type FilterPropertyPickerProps };
