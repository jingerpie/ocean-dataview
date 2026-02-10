"use client";

import type { WhereRule } from "@sparkyidea/shared/types";
import { extractSelectValues } from "@sparkyidea/shared/utils";
import { ChevronDownIcon } from "lucide-react";
import type {
  BadgeColor,
  PropertyMeta,
  StatusConfig,
} from "../../../../../types";
import { Button } from "../../../button";
import { Checkbox } from "../../../checkbox";
import {
  Command,
  CommandChip,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../../../command";
import { Popover, PopoverContent, PopoverTrigger } from "../../../popover";
import { Separator } from "../../../separator";
import { SimpleFilterPopover } from "../simple/simple-filter-popover";

// ============================================================================
// Types
// ============================================================================

interface StatusFilterChipProps {
  rule: WhereRule;
  property: PropertyMeta;
  onRuleChange: (rule: WhereRule) => void;
  onRemove: () => void;
  onAddToAdvanced?: () => void;
  variant?: "compact" | "detailed";
}

interface StatusFilterValueProps {
  rule: WhereRule;
  property: PropertyMeta;
  onValueChange: (value: unknown) => void;
}

interface StatusOption {
  value: string;
  color: BadgeColor;
  group: string;
}

// ============================================================================
// Color mapping for status dots
// ============================================================================

const DOT_COLOR_CLASSES: Record<BadgeColor, string> = {
  gray: "bg-badge-gray-subtle-foreground",
  blue: "bg-badge-blue-subtle-foreground",
  purple: "bg-badge-purple-subtle-foreground",
  yellow: "bg-badge-yellow-subtle-foreground",
  red: "bg-badge-red-subtle-foreground",
  pink: "bg-badge-pink-subtle-foreground",
  green: "bg-badge-green-subtle-foreground",
  teal: "bg-badge-teal-subtle-foreground",
};

// ============================================================================
// Helper: Flatten groups into options with color
// ============================================================================

function flattenStatusOptions(
  config: StatusConfig | undefined
): StatusOption[] {
  if (!config?.groups) {
    return [];
  }
  return config.groups.flatMap((group) =>
    group.options.map((value) => ({
      value,
      color: group.color,
      group: group.label,
    }))
  );
}

// ============================================================================
// StatusBody - Shared content
// ============================================================================

interface StatusGroup {
  label: string;
  color: BadgeColor;
  options: string[];
}

interface StatusBodyProps {
  groups: StatusGroup[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  onToggleGroup: (groupOptions: string[], checked: boolean) => void;
  onClearAll: () => void;
}

function getGroupCheckState(
  groupOptions: string[],
  selectedValues: string[]
): boolean | "indeterminate" {
  const selectedCount = groupOptions.filter((opt) =>
    selectedValues.includes(opt)
  ).length;

  if (selectedCount === 0) {
    return false;
  }
  if (selectedCount === groupOptions.length) {
    return true;
  }
  return "indeterminate";
}

function StatusBody({
  groups,
  selectedValues,
  onToggle,
  onToggleGroup,
  onClearAll,
}: StatusBodyProps) {
  return (
    <Command className="p-0" shouldFilter={false}>
      {/* Options list - grouped */}
      <CommandList>
        <CommandEmpty>No options found.</CommandEmpty>
        <CommandGroup>
          {groups.map((group) => {
            const groupCheckState = getGroupCheckState(
              group.options,
              selectedValues
            );
            const dotClass = DOT_COLOR_CLASSES[group.color];

            return (
              <div key={group.label}>
                {/* Group header */}
                <CommandItem
                  onSelect={() =>
                    onToggleGroup(group.options, groupCheckState !== true)
                  }
                  value={`group-${group.label}`}
                >
                  <Checkbox
                    checked={groupCheckState === true}
                    className="[&_svg]:text-current!"
                    indeterminate={groupCheckState === "indeterminate"}
                  />
                  <div className={`size-2 rounded-full ${dotClass}`} />
                  <span className="font-semibold text-muted-foreground">
                    {group.label}
                  </span>
                </CommandItem>

                {/* Group options */}
                {group.options.map((optionValue) => {
                  const isSelected = selectedValues.includes(optionValue);
                  return (
                    <CommandItem
                      className="pl-4"
                      key={optionValue}
                      onSelect={() => onToggle(optionValue)}
                      value={optionValue}
                    >
                      <Checkbox
                        checked={isSelected}
                        className="[&_svg]:text-current!"
                      />
                      <CommandChip
                        className={`bg-badge-${group.color}-subtle text-badge-${group.color}-subtle-foreground`}
                        showRemove={false}
                      >
                        <div className={`size-2 rounded-full ${dotClass}`} />
                        {optionValue}
                      </CommandChip>
                    </CommandItem>
                  );
                })}
              </div>
            );
          })}
        </CommandGroup>
      </CommandList>

      {/* Clear selection footer */}
      {selectedValues.length > 0 && (
        <div className="sticky bottom-0">
          <Separator className="mb-1" />
          <Button
            className="w-full justify-start"
            onClick={onClearAll}
            variant="ghost"
          >
            Clear selection
          </Button>
        </div>
      )}
    </Command>
  );
}

// ============================================================================
// StatusSimpleFilter - Chip mode using SimpleFilterPopover
// ============================================================================

function StatusSimpleFilter({
  rule,
  property,
  onRuleChange,
  onRemove,
  onAddToAdvanced,
  variant,
}: StatusFilterChipProps) {
  const config = property.config as StatusConfig | undefined;
  const groups = config?.groups ?? [];
  const selectedValues = extractSelectValues(rule.value);

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onRuleChange({ ...rule, value: newValues });
  };

  const handleToggleGroup = (groupOptions: string[], checked: boolean) => {
    if (checked) {
      const newValues = [...new Set([...selectedValues, ...groupOptions])];
      onRuleChange({ ...rule, value: newValues });
    } else {
      const newValues = selectedValues.filter((v) => !groupOptions.includes(v));
      onRuleChange({ ...rule, value: newValues });
    }
  };

  const handleClearAll = () => {
    onRuleChange({ ...rule, value: [] });
  };

  return (
    <SimpleFilterPopover
      onAddToAdvanced={onAddToAdvanced}
      onRemove={onRemove}
      onRuleChange={onRuleChange}
      property={property}
      rule={rule}
      variant={variant}
    >
      <StatusBody
        groups={groups}
        onClearAll={handleClearAll}
        onToggle={handleToggle}
        onToggleGroup={handleToggleGroup}
        selectedValues={selectedValues}
      />
    </SimpleFilterPopover>
  );
}

// ============================================================================
// StatusAdvanceFilter - Row mode (Popover only, no header)
// ============================================================================

function StatusAdvanceFilter({
  rule,
  property,
  onValueChange,
}: StatusFilterValueProps) {
  const config = property.config as StatusConfig | undefined;
  const groups = config?.groups ?? [];
  const options = flattenStatusOptions(config);
  const selectedValues = extractSelectValues(rule.value);

  // Map selected values to options to get colors
  const selectedOptions = selectedValues
    .map((v) => options.find((o) => o.value === v))
    .filter((o): o is StatusOption => o !== undefined);

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onValueChange(newValues);
  };

  const handleToggleGroup = (groupOptions: string[], checked: boolean) => {
    if (checked) {
      const newValues = [...new Set([...selectedValues, ...groupOptions])];
      onValueChange(newValues);
    } else {
      const newValues = selectedValues.filter((v) => !groupOptions.includes(v));
      onValueChange(newValues);
    }
  };

  const handleClearAll = () => {
    onValueChange([]);
  };

  return (
    <Popover>
      <PopoverTrigger
        render={<Button className="max-w-100" variant="outline" />}
      >
        {selectedOptions.length > 0 ? (
          <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
            {selectedOptions.map((option) => {
              const dotClass = DOT_COLOR_CLASSES[option.color];
              return (
                <CommandChip
                  className={`bg-badge-${option.color}-subtle text-badge-${option.color}-subtle-foreground`}
                  key={option.value}
                  showRemove={false}
                >
                  <div className={`size-2 rounded-full ${dotClass}`} />
                  {option.value}
                </CommandChip>
              );
            })}
          </div>
        ) : (
          <span className="text-muted-foreground">Select an option</span>
        )}
        <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <StatusBody
          groups={groups}
          onClearAll={handleClearAll}
          onToggle={handleToggle}
          onToggleGroup={handleToggleGroup}
          selectedValues={selectedValues}
        />
      </PopoverContent>
    </Popover>
  );
}

export { StatusSimpleFilter, StatusAdvanceFilter };
export type { StatusFilterChipProps, StatusFilterValueProps };
