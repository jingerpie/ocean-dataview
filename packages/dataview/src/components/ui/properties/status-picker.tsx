"use client";

import { Badge } from "@ocean-dataview/dataview/components/ui/badge";
import { Checkbox } from "@ocean-dataview/dataview/components/ui/checkbox";
import { getBadgeVariant } from "../../../lib/utils/get-badge-variant";
import type { BadgeColor, StatusConfig } from "../../../types/property.type";

interface StatusPickerProps {
  config: StatusConfig;
  value: string[];
  onValueChange: (values: string[]) => void;
}

// Map badge colors to dot background classes
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

/**
 * Get checkbox state for group header
 * Returns true (all selected), false (none selected), or "indeterminate" (some selected)
 */
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

/**
 * Hierarchical picker for status properties with groups and child options.
 * - Group checkbox toggles all children
 * - Individual option checkboxes for fine-grained selection
 * - Supports indeterminate state when some children are selected
 */
export function StatusPicker({
  config,
  value,
  onValueChange,
}: StatusPickerProps) {
  const groups = config?.groups ?? [];

  if (groups.length === 0) {
    return (
      <div className="px-2 py-4 text-center text-muted-foreground text-sm">
        No options configured
      </div>
    );
  }

  // Toggle all options in a group
  const handleGroupToggle = (groupOptions: string[], checked: boolean) => {
    if (checked) {
      // Add all group options
      const newValues = [...new Set([...value, ...groupOptions])];
      onValueChange(newValues);
    } else {
      // Remove all group options
      const newValues = value.filter((v) => !groupOptions.includes(v));
      onValueChange(newValues);
    }
  };

  // Toggle individual option
  const handleOptionToggle = (option: string, checked: boolean) => {
    if (checked) {
      onValueChange([...value, option]);
    } else {
      onValueChange(value.filter((v) => v !== option));
    }
  };

  return (
    <div className="flex flex-col py-1">
      {groups.map((group) => {
        // Skip empty groups
        if (group.options.length === 0) {
          return null;
        }

        const groupCheckState = getGroupCheckState(group.options, value);
        const dotClass = DOT_COLOR_CLASSES[group.color];

        // Compute data-state without nested ternary
        let dataState: "indeterminate" | "checked" | "unchecked" = "unchecked";
        if (groupCheckState === "indeterminate") {
          dataState = "indeterminate";
        } else if (groupCheckState === true) {
          dataState = "checked";
        }

        return (
          <div className="flex flex-col" key={group.label}>
            {/* Group Header */}
            <button
              className="flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 hover:bg-accent"
              onClick={() =>
                handleGroupToggle(group.options, groupCheckState !== true)
              }
              type="button"
            >
              <Checkbox
                checked={groupCheckState === true}
                data-state={dataState}
                onCheckedChange={(checked) =>
                  handleGroupToggle(group.options, checked === true)
                }
              />
              <div className={`h-2 w-2 rounded-full ${dotClass}`} />
              <span className="font-medium text-sm">{group.label}</span>
            </button>

            {/* Child Options */}
            {group.options.map((option) => (
              <button
                className="flex w-full cursor-pointer items-center gap-2 py-1.5 pr-2 pl-4 hover:bg-accent"
                key={option}
                onClick={() =>
                  handleOptionToggle(option, !value.includes(option))
                }
                type="button"
              >
                <Checkbox
                  checked={value.includes(option)}
                  onCheckedChange={(checked) =>
                    handleOptionToggle(option, checked === true)
                  }
                />
                <Badge variant={getBadgeVariant(group.color)}>
                  <div className={`h-2 w-2 rounded-full ${dotClass}`} />
                  {option}
                </Badge>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
