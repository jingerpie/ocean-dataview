"use client";

import { ChevronDownIcon, CircleDashed } from "lucide-react";
import type { WhereRule } from "../../../../types/filter.type";
import type {
  BadgeColor,
  PropertyMeta,
  StatusConfig,
  StatusGroup,
} from "../../../../types/property.type";
import { extractSelectValues } from "../../../../utils/filter-variant";
import { Button } from "../../button";
import { Checkbox } from "../../checkbox";
import {
  Command,
  CommandChip,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../../command";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover";
import { Separator } from "../../separator";

// ============================================================================
// Types
// ============================================================================

interface StatusFilterValueProps {
  onValueChange: (value: unknown) => void;
  property: PropertyMeta;
  rule: WhereRule;
}

interface StatusOption {
  color: BadgeColor;
  group: string;
  icon?: StatusGroup["icon"];
  value: string;
}

// ============================================================================
// Color mapping for status icons
// ============================================================================

const TEXT_COLOR_CLASSES: Record<BadgeColor, string> = {
  gray: "!text-badge-gray-subtle-foreground",
  blue: "!text-badge-blue-subtle-foreground",
  purple: "!text-badge-purple-subtle-foreground",
  yellow: "!text-badge-yellow-subtle-foreground",
  red: "!text-badge-red-subtle-foreground",
  pink: "!text-badge-pink-subtle-foreground",
  green: "!text-badge-green-subtle-foreground",
  teal: "!text-badge-teal-subtle-foreground",
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
      icon: group.icon,
    }))
  );
}

// ============================================================================
// StatusBody - Shared content
// ============================================================================

interface StatusBodyProps {
  groups: StatusGroup[];
  onClearAll: () => void;
  onToggle: (value: string) => void;
  onToggleGroup: (groupOptions: string[], checked: boolean) => void;
  selectedValues: string[];
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
            const textClass = TEXT_COLOR_CLASSES[group.color];
            const Icon = group.icon ?? CircleDashed;

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
                  <Icon className={`size-4 ${textClass}`} />
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
                        <Icon className="size-3 text-current" />
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
              const Icon = option.icon ?? CircleDashed;
              return (
                <CommandChip
                  className={`bg-badge-${option.color}-subtle text-badge-${option.color}-subtle-foreground`}
                  key={option.value}
                  showRemove={false}
                >
                  <Icon className="size-3 text-current" />
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

// ============================================================================
// StatusValueEditor - Inline editor for SimpleFilterEditor
// ============================================================================

function StatusValueEditor({
  rule,
  property,
  onValueChange,
}: StatusFilterValueProps) {
  const config = property.config as StatusConfig | undefined;
  const groups = config?.groups ?? [];
  const selectedValues = extractSelectValues(rule.value);

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
    <StatusBody
      groups={groups}
      onClearAll={handleClearAll}
      onToggle={handleToggle}
      onToggleGroup={handleToggleGroup}
      selectedValues={selectedValues}
    />
  );
}

export type { StatusFilterValueProps };
export { StatusAdvanceFilter, StatusValueEditor };
