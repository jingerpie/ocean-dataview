"use client";

import type { GroupByConfigInput } from "@sparkyidea/shared/utils/parsers/group";
import { CheckIcon } from "lucide-react";
import { useCallback } from "react";
import { useGroupParams } from "../../../../hooks";
import { Command, CommandGroup, CommandItem, CommandList } from "../../command";

// Property types that support "Show As" options
type ShowAsGroupType = "status" | "date" | "text" | "number";

const SHOW_AS_OPTIONS: Record<
  ShowAsGroupType,
  { value: string; label: string }[]
> = {
  status: [
    { value: "option", label: "Option" },
    { value: "group", label: "Group" },
  ],
  date: [
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "year", label: "Year" },
    { value: "relative", label: "Relative" },
  ],
  text: [
    { value: "exact", label: "Exact" },
    { value: "alphabetical", label: "Alphabetical" },
  ],
  number: [
    { value: "1", label: "1s" },
    { value: "10", label: "10s" },
    { value: "100", label: "100s" },
    { value: "1000", label: "1000s" },
  ],
};

interface GroupShowAsPickerProps {
  /** Additional callback after setting the show-as option */
  onSetShowAs?: (value: string) => void;
}

/**
 * Picker for selecting the "Show As" option for group display.
 *
 * Applicable for status, date, text, and number group types.
 * Handles update internally via useGroupParams().
 */
function GroupShowAsPicker({ onSetShowAs }: GroupShowAsPickerProps) {
  const { group, groupType, setGroup } = useGroupParams();

  // Get show-as options based on group type
  const showAsOptions =
    groupType && groupType in SHOW_AS_OPTIONS
      ? SHOW_AS_OPTIONS[groupType as ShowAsGroupType]
      : null;

  // Get current show-as value
  const getCurrentShowAs = () => {
    if (!group) {
      return null;
    }
    if ("byStatus" in group) {
      return group.byStatus.showAs;
    }
    if ("byDate" in group) {
      return group.byDate.showAs;
    }
    if ("byText" in group) {
      return group.byText.showAs ?? "exact";
    }
    if ("byNumber" in group) {
      // Number uses step value as the showAs identifier
      return String(group.byNumber.showAs?.step ?? 100);
    }
    return null;
  };

  const currentShowAs = getCurrentShowAs();

  const handleSelect = useCallback(
    (value: string) => {
      if (!group) {
        return;
      }

      let newGroup: GroupByConfigInput;
      if ("byStatus" in group) {
        newGroup = {
          byStatus: {
            ...group.byStatus,
            showAs: value as "option" | "group",
          },
        };
      } else if ("byDate" in group) {
        newGroup = {
          byDate: {
            ...group.byDate,
            showAs: value as "day" | "week" | "month" | "year" | "relative",
          },
        };
      } else if ("byText" in group) {
        newGroup = {
          byText: {
            ...group.byText,
            showAs: value as "exact" | "alphabetical",
          },
        };
      } else if ("byNumber" in group) {
        const step = Number.parseInt(value, 10);
        newGroup = {
          byNumber: {
            ...group.byNumber,
            showAs: { range: [0, 1000], step },
          },
        };
      } else {
        return;
      }

      setGroup(newGroup);
      onSetShowAs?.(value);
    },
    [group, setGroup, onSetShowAs]
  );

  if (!showAsOptions) {
    return null;
  }

  return (
    <Command className="p-0">
      <CommandList>
        <CommandGroup>
          {showAsOptions.map((option) => {
            const isSelected = option.value === currentShowAs;
            return (
              <CommandItem
                key={option.value}
                onSelect={() => handleSelect(option.value)}
                value={option.value}
              >
                <span className="flex-1">{option.label}</span>
                {isSelected && <CheckIcon className="size-4" />}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export { GroupShowAsPicker, type GroupShowAsPickerProps };
