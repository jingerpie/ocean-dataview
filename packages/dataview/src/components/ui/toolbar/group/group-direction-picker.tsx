"use client";

import { CheckIcon } from "lucide-react";
import { useCallback } from "react";
import {
  type GroupingMode,
  useGroupingParams,
} from "../../../../hooks/use-grouping-params";
import { Command, CommandGroup, CommandItem, CommandList } from "../../command";

type GroupSortOrder = "asc" | "desc";

const DIRECTION_OPTIONS: { value: GroupSortOrder; label: string }[] = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

interface GroupDirectionPickerProps {
  /** Mode: "group" or "subGroup" (default: "group") */
  mode?: GroupingMode;
  /** Additional callback after setting the direction */
  onSetDirection?: (direction: GroupSortOrder) => void;
}

/**
 * Direction picker for selecting group sort order.
 *
 * Handles direction selection internally via useGroupingParams().
 * Can be used for both primary group and sub-group via the `mode` prop.
 *
 * Features:
 * - Command-based list
 * - Shows checkmark for currently selected direction
 */
function GroupDirectionPicker({
  mode = "group",
  onSetDirection,
}: GroupDirectionPickerProps) {
  const { sortOrder, setSortOrder } = useGroupingParams(mode);

  const handleSelect = useCallback(
    (direction: GroupSortOrder) => {
      setSortOrder(direction);
      onSetDirection?.(direction);
    },
    [setSortOrder, onSetDirection]
  );

  return (
    <Command className="p-0">
      <CommandList>
        <CommandGroup>
          {DIRECTION_OPTIONS.map((option) => (
            <CommandItem
              key={option.value}
              onSelect={() => handleSelect(option.value)}
              value={option.value}
            >
              <span className="flex-1">{option.label}</span>
              {sortOrder === option.value && <CheckIcon className="size-4" />}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export { GroupDirectionPicker, type GroupDirectionPickerProps };
