"use client";

import type { WhereRule } from "@sparkyidea/shared/types";
import { extractSelectValues } from "@sparkyidea/shared/utils";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { getBadgeClasses } from "../../../../../lib/utils";
import type {
  BadgeColor,
  PropertyMeta,
  SelectConfig,
  SelectOption,
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

interface SelectFilterChipProps {
  rule: WhereRule;
  property: PropertyMeta;
  onRuleChange: (rule: WhereRule) => void;
  onRemove: () => void;
  onAddToAdvanced?: () => void;
  variant?: "compact" | "detailed";
}

interface SelectFilterValueProps {
  rule: WhereRule;
  property: PropertyMeta;
  onValueChange: (value: unknown) => void;
}

// ============================================================================
// SelectBody - Shared content using CommandChipsInput + Command
// ============================================================================

interface SelectBodyProps {
  options: SelectOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  onRemove: (value: string) => void;
  onClearAll: () => void;
}

function SelectBody({
  options,
  selectedValues,
  onToggle,
  onRemove,
  onClearAll,
}: SelectBodyProps) {
  const [search, setSearch] = useState("");

  // Preserve insertion order by mapping selectedValues to options
  const selectedOptions = selectedValues
    .map((v) => options.find((o) => o.value === v))
    .filter((o): o is SelectOption => o !== undefined);

  const filteredOptions = options.filter((o) =>
    o.value.toLowerCase().includes(search.toLowerCase())
  );

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
          const color = (option.color ?? "gray") as BadgeColor;
          return (
            <CommandChip
              className={getBadgeClasses(color)}
              key={option.value}
              onRemove={() => onRemove(option.value)}
            >
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

      {/* Options list */}
      <CommandList>
        <CommandEmpty>No options found.</CommandEmpty>
        <CommandGroup>
          {filteredOptions.map((option) => {
            const color = (option.color ?? "gray") as BadgeColor;
            const isSelected = selectedValues.includes(option.value);
            return (
              <CommandItem
                key={option.value}
                onSelect={() => handleSelect(option.value)}
                value={option.value}
              >
                <Checkbox
                  checked={isSelected}
                  className="[&_svg]:text-current!"
                />
                <CommandChip
                  className={getBadgeClasses(color)}
                  showRemove={false}
                >
                  {option.value}
                </CommandChip>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

// ============================================================================
// SelectSimpleFilter - Chip mode using SimpleFilterPopover
// ============================================================================

function SelectSimpleFilter({
  rule,
  property,
  onRuleChange,
  onRemove,
  onAddToAdvanced,
  variant,
}: SelectFilterChipProps) {
  const config = property.config as SelectConfig | undefined;
  const options: SelectOption[] = config?.options ?? [];
  const selectedValues = extractSelectValues(rule.value);

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onRuleChange({ ...rule, value: newValues });
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
      <SelectBody
        onClearAll={handleClearAll}
        onRemove={handleRemove}
        onToggle={handleToggle}
        options={options}
        selectedValues={selectedValues}
      />
    </SimpleFilterPopover>
  );
}

// ============================================================================
// SelectAdvanceFilter - Row mode (Popover only, no header)
// ============================================================================

function SelectAdvanceFilter({
  rule,
  property,
  onValueChange,
}: SelectFilterValueProps) {
  const config = property.config as SelectConfig | undefined;
  const options: SelectOption[] = config?.options ?? [];
  const selectedValues = extractSelectValues(rule.value);

  // Map selected values to options to get colors
  const selectedOptions = selectedValues
    .map((v) => options.find((o) => o.value === v))
    .filter((o): o is SelectOption => o !== undefined);

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onValueChange(newValues);
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
        render={<Button className="max-w-100" variant="outline" />}
      >
        {selectedOptions.length > 0 ? (
          <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
            {selectedOptions.map((option) => {
              const color = (option.color ?? "gray") as BadgeColor;
              return (
                <CommandChip
                  className={getBadgeClasses(color)}
                  key={option.value}
                  showRemove={false}
                >
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
        <SelectBody
          onClearAll={handleClearAll}
          onRemove={handleRemove}
          onToggle={handleToggle}
          options={options}
          selectedValues={selectedValues}
        />
      </PopoverContent>
    </Popover>
  );
}

export { SelectSimpleFilter, SelectAdvanceFilter };
export type { SelectFilterChipProps, SelectFilterValueProps };
