"use client";

import type { FilterCondition, WhereRule } from "@ocean-dataview/shared/types";
import {
  applyConditionChange,
  extractSelectValues,
} from "@ocean-dataview/shared/utils";
import { ChevronDownIcon } from "lucide-react";
import { useSimpleFilterChip } from "../../../../../hooks";
import { getFilterPreview } from "../../../../../lib/filter-preview";
import { getBadgeVariant } from "../../../../../lib/utils/get-badge-variant";
import type {
  PropertyMeta,
  SelectConfig,
  SelectOption,
  StatusConfig,
} from "../../../../../types";
import { Badge } from "../../../badge";
import { Button } from "../../../button";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../../../combobox";
import { Input } from "../../../input";
import { Popover, PopoverContent, PopoverTrigger } from "../../../popover";
import { CheckboxPickerContent } from "../../../properties/checkbox-picker";
import {
  type DateRangeValue,
  RangeDatePickerContent,
  RelativeDatePickerContent,
  type RelativeToTodayValue,
  SingleDateCalendar,
} from "../../../properties/date-picker";
import { StatusPicker } from "../../../properties/status-picker";
import { PropertyIcon } from "../../../property-icon";
import { ConditionPicker } from "../condition-picker";
import { FilterActions } from "./filter-actions";

interface FilterChipProps {
  /** The filter rule */
  rule: WhereRule;
  /** The property being filtered */
  property: PropertyMeta;
  /** Callback when rule changes */
  onRuleChange: (rule: WhereRule) => void;
  /** Callback to remove this filter */
  onRemove: () => void;
  /** Callback to add this filter to advanced filter */
  onAddToAdvanced?: () => void;
  /**
   * Chip variant:
   * - `compact` - Shows property name only: [Icon] Property ▾
   * - `detailed` - Shows property + preview: [Icon] Property: Preview ▾
   * @default "compact"
   */
  variant?: "compact" | "detailed";
}

/**
 * Simple filter chip with inline editor popover.
 *
 * Variants:
 * - `compact`: [◉ Property ▾]
 * - `detailed`: [◉ Property: Preview ▾] (max-width: w-58, truncates)
 */
export function FilterChip({
  rule,
  property,
  onRuleChange,
  onRemove,
  onAddToAdvanced,
  variant: chipVariant = "compact",
}: FilterChipProps) {
  const { openPropertyId, setOpen } = useSimpleFilterChip();
  const isOpen = openPropertyId === rule.property;

  const handleOpenChange = (open: boolean) => {
    setOpen(open ? rule.property : null);
  };

  const label = property.label ?? String(property.id);

  // Compute preview for detailed variant
  const preview =
    chipVariant === "detailed"
      ? getFilterPreview({
          condition: rule.condition,
          value: rule.value,
          propertyType: property.type,
        })
      : "";

  const handleConditionChange = (newCondition: FilterCondition) => {
    onRuleChange(applyConditionChange(rule, newCondition));
  };

  const handleValueChange = (value: unknown) => {
    onRuleChange({
      ...rule,
      value,
    });
  };

  const close = () => setOpen(null);

  // Build trigger content based on variant
  // Preview already includes separator (: or space) from getFilterPreview
  const triggerContent =
    chipVariant === "detailed" ? (
      <>
        <PropertyIcon type={property.type} />
        <span className="truncate">
          {label}
          {preview}
        </span>
        <ChevronDownIcon className="size-3 shrink-0 opacity-50" />
      </>
    ) : (
      <>
        <PropertyIcon type={property.type} />
        <span>{label}</span>
        <ChevronDownIcon className="size-3 opacity-50" />
      </>
    );

  return (
    <Popover onOpenChange={handleOpenChange} open={isOpen}>
      <PopoverTrigger
        className={chipVariant === "detailed" ? "max-w-58" : undefined}
        render={<Button size="sm" variant="secondary" />}
      >
        {triggerContent}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-64 gap-1 p-2">
        {/* Header: Property + Condition + Menu */}
        <div className="flex items-center justify-between">
          <div className="flex items-center pl-2">
            <span className="font-medium text-muted-foreground text-sm">
              {label}
            </span>
            <ConditionPicker
              condition={rule.condition}
              inline
              onConditionChange={handleConditionChange}
              propertyType={property.type}
            />
          </div>
          <FilterActions
            onAddToAdvanced={
              onAddToAdvanced
                ? () => {
                    onAddToAdvanced();
                    close();
                  }
                : undefined
            }
            onRemove={() => {
              onRemove();
              close();
            }}
          />
        </div>

        {/* Value Input */}
        <FilterChipValue
          onValueChange={handleValueChange}
          property={property}
          rule={rule}
        />
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// FilterChipValue - Value input for filter chip
// ============================================================================

interface FilterChipValueProps {
  rule: WhereRule;
  property: PropertyMeta;
  onValueChange: (value: unknown) => void;
}

function FilterChipValue({
  rule,
  property,
  onValueChange,
}: FilterChipValueProps) {
  // Empty/Not Empty conditions don't need value input
  if (rule.condition === "isEmpty" || rule.condition === "isNotEmpty") {
    return null;
  }

  switch (property.type) {
    case "text":
    case "url":
    case "email":
    case "phone":
      return (
        <Input
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Enter value..."
          type="text"
          value={rule.value != null ? String(rule.value) : ""}
        />
      );

    case "number":
      return (
        <Input
          inputMode="numeric"
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Enter value..."
          type="number"
          value={rule.value != null ? String(rule.value) : ""}
        />
      );

    case "checkbox":
      return (
        <CheckboxPickerContent
          onChange={onValueChange}
          value={rule.value as boolean | undefined}
        />
      );

    case "select": {
      const config = property.config as SelectConfig | undefined;
      const options: SelectOption[] = config?.options ?? [];
      const selectedValues = extractSelectValues(rule.value);
      const selectedOptions = options.filter((o) =>
        selectedValues.includes(o.value)
      );

      return (
        <Combobox
          items={options}
          multiple
          onValueChange={(newValues) => {
            const values = (newValues as SelectOption[]).map((o) => o.value);
            onValueChange(values);
          }}
          open
          value={selectedOptions}
        >
          <ComboboxInput
            className="h-8"
            placeholder="Search options..."
            showTrigger={false}
          />
          <ComboboxEmpty>No options found.</ComboboxEmpty>
          <ComboboxList className="max-h-48">
            {(option: SelectOption) => (
              <ComboboxItem key={option.value} value={option}>
                <Badge variant={getBadgeVariant(option.color)}>
                  {option.value}
                </Badge>
              </ComboboxItem>
            )}
          </ComboboxList>
        </Combobox>
      );
    }

    case "multiSelect": {
      const config = property.config as SelectConfig | undefined;
      const options: SelectOption[] = config?.options ?? [];
      const selectedValues = extractSelectValues(rule.value);
      const selectedOptions = options.filter((o) =>
        selectedValues.includes(o.value)
      );

      return (
        <Combobox
          items={options}
          multiple
          onValueChange={(newValues) => {
            const values = (newValues as SelectOption[]).map((o) => o.value);
            onValueChange(values);
          }}
          open
          value={selectedOptions}
        >
          <ComboboxInput
            className="h-8"
            placeholder="Search options..."
            showTrigger={false}
          />
          <ComboboxEmpty>No options found.</ComboboxEmpty>
          <ComboboxList className="max-h-48">
            {(option: SelectOption) => (
              <ComboboxItem key={option.value} value={option}>
                <Badge variant={getBadgeVariant(option.color)}>
                  {option.value}
                </Badge>
              </ComboboxItem>
            )}
          </ComboboxList>
        </Combobox>
      );
    }

    case "status": {
      const config = property.config as StatusConfig | undefined;
      return (
        <StatusPicker
          config={config ?? { groups: [] }}
          onValueChange={onValueChange}
          value={extractSelectValues(rule.value)}
        />
      );
    }

    case "date": {
      if (rule.condition === "isBetween") {
        return (
          <RangeDatePickerContent
            onChange={onValueChange}
            value={rule.value as DateRangeValue | undefined}
          />
        );
      }
      if (rule.condition === "isRelativeToToday") {
        return (
          <RelativeDatePickerContent
            onChange={onValueChange}
            value={rule.value as RelativeToTodayValue | undefined}
          />
        );
      }
      return (
        <SingleDateCalendar
          onChange={onValueChange}
          value={rule.value as string | undefined}
        />
      );
    }

    case "filesMedia":
    case "formula":
      // Only support isEmpty/isNotEmpty (handled above)
      return null;

    default:
      return null;
  }
}

export type { FilterChipProps };
