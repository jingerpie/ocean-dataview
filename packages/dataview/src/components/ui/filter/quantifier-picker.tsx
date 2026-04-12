"use client";

import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "../../../lib/utils";
import type { Quantifier } from "../../../types/filter.type";
import { Button } from "../button";
import { Command, CommandGroup, CommandItem, CommandList } from "../command";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";

const QUANTIFIER_OPTIONS: { label: string; value: Quantifier }[] = [
  { label: "Any", value: "any" },
  { label: "None", value: "none" },
  { label: "Every", value: "every" },
];

interface QuantifierPickerProps {
  className?: string;
  /** Inline style (no border, transparent) for filter chips */
  inline?: boolean;
  onQuantifierChange: (quantifier: Quantifier) => void;
  quantifier: Quantifier;
}

function QuantifierPicker({
  quantifier,
  onQuantifierChange,
  inline,
  className,
}: QuantifierPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = QUANTIFIER_OPTIONS.find((o) => o.value === quantifier);

  const handleSelect = (value: Quantifier) => {
    onQuantifierChange(value);
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
        <span>{selected?.label ?? quantifier}</span>
        <ChevronDownIcon
          className={cn(
            "pointer-events-none text-muted-foreground",
            inline ? "size-3" : "size-4"
          )}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-24 p-0">
        <Command className="p-0" value={selected?.label}>
          <CommandList>
            <CommandGroup>
              {QUANTIFIER_OPTIONS.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  value={option.label}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export type { QuantifierPickerProps };
export { QuantifierPicker };
