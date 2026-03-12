"use client";

import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { getBadgeClasses } from "../../../../../lib/utils";
import { extractSelectValues } from "../../../../../lib/utils/filter-variant";
import type {
  BadgeColor,
  PropertyMeta,
  SelectConfig,
  SelectOption,
  WhereRule,
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

// ============================================================================
// Types
// ============================================================================

interface SelectFilterValueProps {
  onValueChange: (value: unknown) => void;
  property: PropertyMeta;
  rule: WhereRule;
}

// ============================================================================
// SelectBody - Shared content using CommandChipsInput + Command
// ============================================================================

interface SelectBodyProps {
  onClearAll: () => void;
  onRemove: (value: string) => void;
  onToggle: (value: string) => void;
  options: SelectOption[];
  selectedValues: string[];
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

// ============================================================================
// SelectValueEditor - Inline editor for SimpleFilterEditor
// ============================================================================

function SelectValueEditor({
  rule,
  property,
  onValueChange,
}: SelectFilterValueProps) {
  const config = property.config as SelectConfig | undefined;
  const options: SelectOption[] = config?.options ?? [];
  const selectedValues = extractSelectValues(rule.value);

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
    <SelectBody
      onClearAll={handleClearAll}
      onRemove={handleRemove}
      onToggle={handleToggle}
      options={options}
      selectedValues={selectedValues}
    />
  );
}

export { SelectAdvanceFilter, SelectValueEditor };
export type { SelectFilterValueProps };
