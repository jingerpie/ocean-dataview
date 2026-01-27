"use client";

import { Badge } from "@ocean-dataview/dataview/components/ui/badge";
import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@ocean-dataview/dataview/components/ui/combobox";
import { Input } from "@ocean-dataview/dataview/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ocean-dataview/dataview/components/ui/popover";
import { PropertyIcon } from "@ocean-dataview/dataview/components/ui/property-icon";
import { useSimpleFilterChip } from "@ocean-dataview/dataview/hooks";
import type {
  PropertyMeta,
  SelectConfig,
  SelectOption,
} from "@ocean-dataview/dataview/types";
import type { FilterCondition, WhereRule } from "@ocean-dataview/shared/types";
import { getFilterVariantFromPropertyType } from "@ocean-dataview/shared/utils";
import { ChevronDownIcon } from "lucide-react";
import { getFilterPreview } from "../../../../lib/filter-preview";
import { getBadgeVariant } from "../../../../lib/utils/get-badge-variant";
import { CheckboxPickerContent } from "../../properties/checkbox-picker";
import {
  type DateRangeValue,
  RangeDatePickerContent,
  RelativeDatePickerContent,
  type RelativeToTodayValue,
  SingleDateCalendar,
} from "../../properties/date-picker";
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

  const filterVariant = getFilterVariantFromPropertyType(property.type);
  const label = property.label ?? String(property.id);

  // Get select options for preview (if applicable)
  const selectConfig =
    property.type === "select" ||
    property.type === "status" ||
    property.type === "multiSelect"
      ? (property.config as SelectConfig | undefined)
      : undefined;
  const options: SelectOption[] = selectConfig?.options ?? [];

  // Compute preview for detailed variant
  const preview =
    chipVariant === "detailed"
      ? getFilterPreview({
          condition: rule.condition,
          value: rule.value,
          variant: filterVariant as
            | "text"
            | "number"
            | "date"
            | "dateRange"
            | "boolean"
            | "select"
            | "multiSelect",
          options,
        })
      : "";

  const handleConditionChange = (condition: FilterCondition) => {
    onRuleChange({
      ...rule,
      condition,
      value:
        condition === "isEmpty" || condition === "isNotEmpty"
          ? undefined
          : rule.value,
    });
  };

  const handleValueChange = (value: unknown) => {
    onRuleChange({
      ...rule,
      value,
    });
  };

  const close = () => setOpen(null);

  // Build trigger content based on variant
  const triggerContent =
    chipVariant === "detailed" ? (
      <>
        <PropertyIcon type={property.type} />
        <span className="truncate">
          {label}
          {preview ? `: ${preview}` : ""}
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
      <PopoverContent align="start" className="w-auto gap-1 p-2">
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
              variant={filterVariant}
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
          variant={filterVariant}
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
  variant: string;
  onValueChange: (value: unknown) => void;
}

function FilterChipValue({
  rule,
  property,
  variant,
  onValueChange,
}: FilterChipValueProps) {
  // Empty/Not Empty conditions don't need value input
  if (rule.condition === "isEmpty" || rule.condition === "isNotEmpty") {
    return null;
  }

  switch (variant) {
    case "text":
    case "number":
    case "range":
      return (
        <Input
          inputMode={variant === "text" ? undefined : "numeric"}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Enter value..."
          type={variant === "text" ? "text" : "number"}
          value={rule.value != null ? String(rule.value) : ""}
        />
      );

    case "boolean":
      return (
        <CheckboxPickerContent
          onChange={onValueChange}
          value={rule.value as boolean | undefined}
        />
      );

    case "select":
    case "multiSelect": {
      const selectConfig =
        property.type === "select" ||
        property.type === "status" ||
        property.type === "multiSelect"
          ? (property.config as SelectConfig | undefined)
          : undefined;
      const options: SelectOption[] = selectConfig?.options ?? [];

      let selectedValues: string[];
      if (Array.isArray(rule.value)) {
        selectedValues = rule.value as string[];
      } else if (rule.value) {
        selectedValues = [rule.value as string];
      } else {
        selectedValues = [];
      }

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
                  {option.label}
                </Badge>
              </ComboboxItem>
            )}
          </ComboboxList>
        </Combobox>
      );
    }

    case "date":
    case "dateRange":
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

    default:
      return null;
  }
}

export type { FilterChipProps };
