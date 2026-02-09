"use client";

import type { WhereRule } from "@sparkyidea/shared/types";
import { extractSelectValues } from "@sparkyidea/shared/utils";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
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
  CommandChips,
  CommandChipsInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../../../command";
import { Popover, PopoverContent, PopoverTrigger } from "../../../popover";
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
// StatusBody - Shared content using CommandChipsInput + Command
// ============================================================================

interface StatusGroup {
  label: string;
  color: BadgeColor;
  options: string[];
}

interface StatusBodyProps {
  groups: StatusGroup[];
  options: StatusOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  onToggleGroup: (groupOptions: string[], checked: boolean) => void;
  onRemove: (value: string) => void;
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
  options,
  selectedValues,
  onToggle,
  onToggleGroup,
  onRemove,
  onClearAll,
}: StatusBodyProps) {
  const [search, setSearch] = useState("");

  // Preserve insertion order by mapping selectedValues to options
  const selectedOptions = selectedValues
    .map((v) => options.find((o) => o.value === v))
    .filter((o): o is StatusOption => o !== undefined);

  const searchLower = search.toLowerCase();

  const handleSelect = (value: string) => {
    onToggle(value);
    setSearch("");
  };

  return (
    <Command className="p-0" shouldFilter={false}>
      {/* Chips + search input */}
      <CommandChips
        onClearAll={selectedOptions.length > 0 ? onClearAll : undefined}
      >
        {selectedOptions.map((option) => {
          const dotClass = DOT_COLOR_CLASSES[option.color];
          return (
            <CommandChip
              className={`bg-badge-${option.color}-subtle text-badge-${option.color}-subtle-foreground`}
              key={option.value}
              onRemove={() => onRemove(option.value)}
            >
              <div className={`size-2 rounded-full ${dotClass}`} />
              {option.value}
            </CommandChip>
          );
        })}
        <CommandChipsInput
          onValueChange={setSearch}
          placeholder={
            selectedOptions.length > 0 ? "" : "Select one or more options..."
          }
          value={search}
        />
      </CommandChips>

      {/* Options list - grouped */}
      <CommandList>
        <CommandEmpty>No options found.</CommandEmpty>
        <CommandGroup>
          {groups.map((group) => {
            // Filter options in this group by search
            const filteredGroupOptions = group.options.filter((opt) =>
              opt.toLowerCase().includes(searchLower)
            );

            if (filteredGroupOptions.length === 0) {
              return null;
            }

            const groupCheckState = getGroupCheckState(
              group.options,
              selectedValues
            );
            const dotClass = DOT_COLOR_CLASSES[group.color];

            return (
              <div key={group.label}>
                {/* Group header */}
                <CommandItem
                  className="px-1.5 py-1"
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
                  <span className="font-medium">{group.label}</span>
                </CommandItem>

                {/* Group options */}
                {filteredGroupOptions.map((optionValue) => {
                  const isSelected = selectedValues.includes(optionValue);
                  return (
                    <CommandItem
                      className="px-1.5 py-1 pl-4"
                      key={optionValue}
                      onSelect={() => handleSelect(optionValue)}
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
  const options = flattenStatusOptions(config);
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

  const handleRemove = (value: string) => {
    onRuleChange({ ...rule, value: selectedValues.filter((v) => v !== value) });
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
        onRemove={handleRemove}
        onToggle={handleToggle}
        onToggleGroup={handleToggleGroup}
        options={options}
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

  const handleRemove = (value: string) => {
    onValueChange(selectedValues.filter((v) => v !== value));
  };

  const handleClearAll = () => {
    onValueChange([]);
  };

  return (
    <Popover>
      <PopoverTrigger
        render={<Button className="max-w-100" size="sm" variant="outline" />}
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
          onRemove={handleRemove}
          onToggle={handleToggle}
          onToggleGroup={handleToggleGroup}
          options={options}
          selectedValues={selectedValues}
        />
      </PopoverContent>
    </Popover>
  );
}

export { StatusSimpleFilter, StatusAdvanceFilter };
export type { StatusFilterChipProps, StatusFilterValueProps };
