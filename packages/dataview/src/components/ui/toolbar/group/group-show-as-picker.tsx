"use client";

import type { GroupByConfigInput } from "@sparkyidea/shared/utils/parsers/group";
import { CheckIcon } from "lucide-react";
import { useCallback } from "react";
import {
  type GroupingMode,
  useGroupingParams,
} from "../../../../hooks/use-grouping-params";
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
  /** Mode: "group" or "subGroup" (default: "group") */
  mode?: GroupingMode;
  /** Additional callback after setting the show-as option */
  onSetShowAs?: (value: string) => void;
}

/**
 * Picker for selecting the "Show As" option for group display.
 *
 * Applicable for status, date, text, and number group types.
 * Handles update internally via useGroupingParams().
 * Can be used for both primary group and sub-group via the `mode` prop.
 */
function GroupShowAsPicker({
  mode = "group",
  onSetShowAs,
}: GroupShowAsPickerProps) {
  const { config, type, setConfig } = useGroupingParams(mode);

  // Get show-as options based on group type
  const showAsOptions =
    type && type in SHOW_AS_OPTIONS
      ? SHOW_AS_OPTIONS[type as ShowAsGroupType]
      : null;

  // Get current show-as value
  const getCurrentShowAs = () => {
    if (!config) {
      return null;
    }
    if ("byStatus" in config) {
      return config.byStatus.showAs;
    }
    if ("byDate" in config) {
      return config.byDate.showAs;
    }
    if ("byText" in config) {
      return config.byText.showAs ?? "exact";
    }
    if ("byNumber" in config) {
      // Number uses step value as the showAs identifier
      return String(config.byNumber.showAs?.step ?? 100);
    }
    return null;
  };

  const currentShowAs = getCurrentShowAs();

  const handleSelect = useCallback(
    (value: string) => {
      if (!config) {
        return;
      }

      let newConfig: GroupByConfigInput;
      if ("byStatus" in config) {
        newConfig = {
          byStatus: {
            ...config.byStatus,
            showAs: value as "option" | "group",
          },
        };
      } else if ("byDate" in config) {
        newConfig = {
          byDate: {
            ...config.byDate,
            showAs: value as "day" | "week" | "month" | "year" | "relative",
          },
        };
      } else if ("byText" in config) {
        newConfig = {
          byText: {
            ...config.byText,
            showAs: value as "exact" | "alphabetical",
          },
        };
      } else if ("byNumber" in config) {
        const step = Number.parseInt(value, 10);
        newConfig = {
          byNumber: {
            ...config.byNumber,
            showAs: { range: [0, 1000], step },
          },
        };
      } else {
        return;
      }

      setConfig(newConfig);
      onSetShowAs?.(value);
    },
    [config, setConfig, onSetShowAs]
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
