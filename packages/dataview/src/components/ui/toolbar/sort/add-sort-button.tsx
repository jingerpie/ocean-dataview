"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "../../../../lib/utils";
import type { PropertyMeta } from "../../../../types";
import { Button } from "../../button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../command";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover";
import { PropertyIcon } from "../../property-icon";

interface AddSortButtonProps {
  /** Additional class names */
  className?: string;
  /** Callback when a property is selected */
  onSelect: (propertyId: string) => void;
  /** Available properties to sort by */
  properties: readonly PropertyMeta[];
}

/**
 * Button to add a new sort rule.
 *
 * Opens a searchable dropdown with available properties.
 */
function AddSortButton({
  properties,
  onSelect,
  className,
}: AddSortButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        className={cn("w-full justify-start text-muted-foreground", className)}
        render={<Button variant="ghost" />}
      >
        <PlusIcon />
        Add sort
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 p-0">
        <Command className="p-0">
          <CommandInput placeholder="Search fields..." />
          <CommandEmpty>No fields found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {properties.map((property) => (
                <CommandItem
                  key={String(property.id)}
                  onSelect={() => {
                    onSelect(String(property.id));
                    setOpen(false);
                  }}
                  value={String(property.label ?? property.id)}
                >
                  <PropertyIcon type={property.type} />
                  <span className="truncate">
                    {property.label ?? property.id}
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

export { AddSortButton, type AddSortButtonProps };
