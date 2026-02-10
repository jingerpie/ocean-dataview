"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SortQuery } from "@sparkyidea/shared/types";
import { GripVerticalIcon, XIcon } from "lucide-react";
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
import { DirectionPicker } from "./direction-picker";

interface SortRuleProps {
  /** The sort rule */
  sort: SortQuery;
  /** The current property for this sort */
  property: PropertyMeta;
  /** All available properties */
  properties: readonly PropertyMeta[];
  /** Callback when sort rule changes */
  onUpdate: (updates: Partial<SortQuery>) => void;
  /** Callback to remove this sort rule */
  onRemove: () => void;
  /** Whether to enable drag-and-drop (default: true) */
  draggable?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Single sort rule row with property picker, direction picker, and remove button.
 *
 * When `draggable` is true (default), includes a drag handle for reordering.
 */
function SortRule({
  sort,
  property,
  properties,
  onUpdate,
  onRemove,
  draggable = true,
  className,
}: SortRuleProps) {
  const [open, setOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sort.property,
    disabled: !draggable,
  });

  const style = draggable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
      }
    : undefined;

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        isDragging && "opacity-50",
        className
      )}
      ref={draggable ? setNodeRef : undefined}
      style={style}
    >
      {/* Drag Handle */}
      {draggable && (
        <Button
          className="cursor-grab touch-none"
          size="icon-xs"
          variant="ghost"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="text-muted-foreground" />
        </Button>
      )}

      <div className="flex flex-1 items-center gap-2">
        {/* Property Selector */}
        <Popover onOpenChange={setOpen} open={open}>
          <PopoverTrigger render={<Button variant="outline" />}>
            <PropertyIcon type={property.type} />
            <span className="truncate">{property.label ?? property.id}</span>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-48 p-0">
            <Command className="p-0">
              <CommandInput placeholder="Search fields..." />
              <CommandEmpty>No fields found.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {properties.map((prop) => (
                    <CommandItem
                      data-checked={prop.id === sort.property}
                      key={String(prop.id)}
                      onSelect={() => {
                        onUpdate({ property: String(prop.id) });
                        setOpen(false);
                      }}
                      value={String(prop.label ?? prop.id)}
                    >
                      <PropertyIcon type={prop.type} />
                      <span className="truncate">{prop.label ?? prop.id}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Direction Picker */}
        <DirectionPicker
          onValueChange={(direction) => onUpdate({ direction })}
          value={sort.direction}
        />
      </div>
      {/* Remove Button */}
      <Button
        aria-label="Remove sort"
        onClick={onRemove}
        size="icon-sm"
        variant="ghost"
      >
        <XIcon />
      </Button>
    </div>
  );
}

export { SortRule, type SortRuleProps };
