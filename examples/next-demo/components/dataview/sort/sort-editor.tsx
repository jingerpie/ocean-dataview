"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PropertyMeta, SortQuery } from "@jingerpie/dataview-core";
import { useSortParams } from "@jingerpie/dataview-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { GripVerticalIcon, XIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { PropertyIcon } from "@/components/dataview/shared/property-icon";
import { DirectionPicker } from "@/components/dataview/sort/direction-picker";
import { Button } from "@/components/ui/dataview-button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/dataview-command";

interface SortEditorProps {
  /** Additional class names */
  className?: string;
  /** Whether to enable drag-and-drop (default: true) */
  draggable?: boolean;
  /** Additional callback after removing this sort rule */
  onRemove?: () => void;
  /** Additional callback after sort rule changes */
  onUpdate?: (updates: Partial<SortQuery>) => void;
  /** All available properties (for property picker dropdown) */
  properties: readonly PropertyMeta[];
  /** The sort rule */
  sort: SortQuery;
}

/**
 * Editor for a single sort rule.
 *
 * Handles remove and update internally via useSortParams.
 * Callbacks are for additional actions only.
 *
 * Displays:
 * - Drag handle (when draggable=true)
 * - Property dropdown
 * - Direction dropdown (Ascending/Descending)
 * - Remove button
 */
function SortEditor({
  sort,
  properties,
  onUpdate,
  onRemove,
  draggable = true,
  className,
}: SortEditorProps) {
  const { updateSort, removeSort } = useSortParams();
  const [open, setOpen] = useState(false);

  const property = properties.find((p) => String(p.id) === sort.property);

  const handleUpdate = useCallback(
    (updates: Partial<SortQuery>) => {
      updateSort(sort.property, updates);
      onUpdate?.(updates);
    },
    [sort.property, updateSort, onUpdate]
  );

  const handleRemove = useCallback(() => {
    removeSort(sort.property);
    onRemove?.();
  }, [sort.property, removeSort, onRemove]);

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
            {property && <PropertyIcon type={property.type} />}
            <span className="truncate">
              {property?.name ?? property?.id ?? sort.property}
            </span>
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
                        handleUpdate({ property: String(prop.id) });
                        setOpen(false);
                      }}
                      value={String(prop.name ?? prop.id)}
                    >
                      <PropertyIcon type={prop.type} />
                      <span className="truncate">{prop.name ?? prop.id}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Direction Picker */}
        <DirectionPicker
          onValueChange={(direction) => handleUpdate({ direction })}
          value={sort.direction}
        />
      </div>

      {/* Remove Button */}
      <Button
        aria-label="Remove sort"
        onClick={handleRemove}
        size="icon-xs"
        variant="ghost"
      >
        <XIcon />
      </Button>
    </div>
  );
}

export { SortEditor, type SortEditorProps };
