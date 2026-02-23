"use client";

import { CheckIcon } from "lucide-react";
import { useCallback } from "react";
import { useGroupParams } from "../../../../hooks";
import { Command, CommandGroup, CommandItem, CommandList } from "../../command";

type GroupSortOrder = "asc" | "desc";

const DIRECTION_OPTIONS: { value: GroupSortOrder; label: string }[] = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

interface GroupDirectionPickerProps {
  /** Additional callback after setting the direction */
  onSetDirection?: (direction: GroupSortOrder) => void;
}

/**
 * Direction picker for selecting group sort order.
 *
 * Handles direction selection internally via useGroupParams().
 *
 * Features:
 * - Command-based list
 * - Shows checkmark for currently selected direction
 */
function GroupDirectionPicker({ onSetDirection }: GroupDirectionPickerProps) {
  const { groupSortOrder, setGroupSortOrder } = useGroupParams();

  const handleSelect = useCallback(
    (direction: GroupSortOrder) => {
      setGroupSortOrder(direction);
      onSetDirection?.(direction);
    },
    [setGroupSortOrder, onSetDirection]
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
              {groupSortOrder === option.value && (
                <CheckIcon className="size-4" />
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export { GroupDirectionPicker, type GroupDirectionPickerProps };
