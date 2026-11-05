"use client";

import type {
  FilterCondition,
  PropertyMeta,
  PropertyType,
} from "@sparkyidea/dataview-core";
import {
  getFilterConditions,
  getFilterConditionsForProperty,
} from "@sparkyidea/dataview-core";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@sparkyidea/ui/components/popover";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/registry/base-nova/ui/dataview-button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/registry/base-nova/ui/dataview-command";

interface ConditionPickerProps {
  className?: string;
  condition: FilterCondition;
  /** Inline style (no border, transparent) for filter chips */
  inline?: boolean;
  onConditionChange: (condition: FilterCondition) => void;
  /** Full property metadata — used to resolve rollup effective type */
  property?: PropertyMeta;
  /** Property type determines available conditions */
  propertyType: PropertyType;
}

function ConditionPicker({
  condition,
  onConditionChange,
  propertyType,
  property,
  inline,
  className,
}: ConditionPickerProps) {
  const [open, setOpen] = useState(false);
  const items =
    property && property.type === "rollup"
      ? getFilterConditionsForProperty(property)
      : getFilterConditions(propertyType);
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

export type { ConditionPickerProps };
export { ConditionPicker };
