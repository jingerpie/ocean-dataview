"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useSortParams } from "../../../hooks/use-sort-params";
import type { PropertyMeta } from "../../../types/property.type";
import { Command, CommandGroup, CommandItem, CommandList } from "../command";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { SortEditor } from "./sort-editor";
import { SortPicker } from "./sort-picker";

interface SortBulkEditorProps {
  /** Additional callback after delete all (e.g., close popover) */
  onDeleteAll?: () => void;
  /** Available properties to sort by */
  properties: readonly PropertyMeta[];
}

/**
 * Bulk editor for managing multiple sort rules.
 *
 * Shows list of SortEditors with DnD, Add button (popover), and Delete all.
 * Uses Command for consistent UI.
 */
function SortBulkEditor({ properties, onDeleteAll }: SortBulkEditorProps) {
  const { sort: sorts, setSort, clearSort } = useSortParams();
  const [pickerOpen, setPickerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortIds = useMemo(() => sorts.map((s) => s.property), [sorts]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = sorts.findIndex((s) => s.property === active.id);
        const newIndex = sorts.findIndex((s) => s.property === over.id);
        setSort(arrayMove(sorts, oldIndex, newIndex));
      }
    },
    [sorts, setSort]
  );

  const handleDeleteAll = useCallback(() => {
    clearSort();
    onDeleteAll?.();
  }, [clearSort, onDeleteAll]);

  return (
    <Command className="p-0">
      <CommandList>
        {/* Sort list with DnD */}
        <CommandGroup>
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <SortableContext
              items={sortIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2 py-1">
                {sorts.map((sort) => (
                  <SortEditor
                    key={sort.property}
                    properties={properties}
                    sort={sort}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CommandGroup>

        {/* Actions */}
        <CommandGroup>
          <Popover onOpenChange={setPickerOpen} open={pickerOpen}>
            <PopoverTrigger
              nativeButton={false}
              render={
                <CommandItem
                  onSelect={() => setPickerOpen((prev) => !prev)}
                  value="add-sort"
                />
              }
            >
              <PlusIcon />
              <span>Add sort</span>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-0">
              <SortPicker
                onAddSort={() => setPickerOpen(false)}
                properties={properties}
              />
            </PopoverContent>
          </Popover>
          <CommandItem className="text-destructive" onSelect={handleDeleteAll}>
            <Trash2Icon />
            <span>Delete sort</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export { SortBulkEditor, type SortBulkEditorProps };
