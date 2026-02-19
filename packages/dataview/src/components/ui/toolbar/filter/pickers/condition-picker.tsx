"use client";

import type { FilterCondition } from "@sparkyidea/shared/types";
import { getFilterConditions } from "@sparkyidea/shared/utils";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "../../../../../lib/utils";
import type { PropertyType } from "../../../../../types";
import { Button } from "../../../button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../../../command";
import { Popover, PopoverContent, PopoverTrigger } from "../../../popover";

interface ConditionPickerProps {
  className?: string;
  condition: FilterCondition;
  /** Inline style (no border, transparent) for filter chips */
  inline?: boolean;
  onConditionChange: (condition: FilterCondition) => void;
  /** Property type determines available conditions */
  propertyType: PropertyType;
}

function ConditionPicker({
  condition,
  onConditionChange,
  propertyType,
  inline,
  className,
}: ConditionPickerProps) {
  const [open, setOpen] = useState(false);
  const items = getFilterConditions(propertyType);
  const selected = items.find((item) => item.value === condition);

  const handleSelect = (value: string) => {
    onConditionChange(value as FilterCondition);
    setOpen(false);
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button
            className={cn(className)}
            size={inline ? "sm" : "default"}
            variant={inline ? "ghost" : "outline"}
          />
        }
      >
        <span>{selected?.label ?? condition}</span>
        <ChevronDownIcon
          className={cn(
            "pointer-events-none text-muted-foreground",
            inline ? "size-3" : "size-4"
          )}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-32 p-0">
        <Command className="p-0" value={selected?.label}>
          <CommandList>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  onSelect={() => handleSelect(item.value)}
                  value={item.label}
                >
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { ConditionPicker };
export type { ConditionPickerProps };
