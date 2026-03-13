"use client";

import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "../../../../lib/utils";
import { Button } from "../../button";
import { Command, CommandGroup, CommandItem, CommandList } from "../../command";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover";

const LOGIC_OPTIONS = [
  { value: "and", label: "And", description: "All filters must match" },
  { value: "or", label: "Or", description: "At least one filter must match" },
] as const;

interface LogicPickerProps {
  /** Additional class names */
  className?: string;
  /** Whether this is the first rule (shows "Where" label) */
  isFirst: boolean;
  /** Whether this is the second rule (shows dropdown, can change logic) */
  isSecond: boolean;
  /** Current logic */
  logic: "and" | "or";
  /** Callback when logic changes */
  onLogicChange: (logic: "and" | "or") => void;
}

/**
 * Logic picker for filter rules.
 * - First rule shows static "Where" label
 * - Second rule shows "And" / "Or" dropdown (can change logic for entire group)
 * - Third+ rules show static "And" / "Or" label
 */
function LogicPicker({
  isFirst,
  isSecond,
  logic,
  onLogicChange,
  className,
}: LogicPickerProps) {
  const [open, setOpen] = useState(false);

  // First item shows "Where"
  if (isFirst) {
    return (
      <span
        className={cn(
          "inline-flex min-w-17 items-center justify-end pr-2 font-medium text-muted-foreground text-sm",
          className
        )}
      >
        Where
      </span>
    );
  }

  // Third+ items show static label
  if (!isSecond) {
    return (
      <span
        className={cn(
          "inline-flex min-w-17 items-center justify-end pr-2 font-medium text-muted-foreground text-sm capitalize",
          className
        )}
      >
        {logic}
      </span>
    );
  }

  const selected = LOGIC_OPTIONS.find((opt) => opt.value === logic);

  const handleSelect = (value: string) => {
    onLogicChange(value as "and" | "or");
    setOpen(false);
  };

  // Second item shows dropdown
  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={<Button className="min-w-17" variant="outline" />}
      >
        <span>{selected?.label}</span>
        <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-48 p-0">
        <Command className="p-0" value={selected?.label}>
          <CommandList>
            <CommandGroup>
              {LOGIC_OPTIONS.map((option) => (
                <CommandItem
                  className="flex flex-col items-start gap-0"
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  value={option.label}
                >
                  <span className="font-medium">{option.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {option.description}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { LogicPicker };
