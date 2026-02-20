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
import type { SortQuery } from "@sparkyidea/shared/types";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useSortParams } from "../../../../hooks";
import type { PropertyMeta } from "../../../../types";
import { Button } from "../../button";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover";
import { SortEditor } from "./sort-editor";
import { SortPicker } from "./sort-picker";

interface SortBulkEditorProps {
  /** Additional callback after delete all (e.g., close popover) */
  onDeleteAll?: () => void;
  /** Additional callback after sorts change */
  onSortsChange?: (sorts: SortQuery[]) => void;
  /** Available properties to sort by */
  properties: readonly PropertyMeta[];
}

/**
 * Bulk editor for managing multiple sort rules.
 *
 * Shows list of SortEditors with DnD, Add button, and Delete all.
 * Parent component decides when to show this vs SortPicker.
 */
function SortBulkEditor({
  properties,
  onSortsChange,
  onDeleteAll,
}: SortBulkEditorProps) {
  const { sort: sorts, setSort, addSort, clearSort } = useSortParams();
  const [addPickerOpen, setAddPickerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortIds = useMemo(() => sorts.map((s) => s.property), [sorts]);

  const updateSorts = useCallback(
    (newSorts: SortQuery[]) => {
      setSort(newSorts);
      onSortsChange?.(newSorts);
    },
    [setSort, onSortsChange]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = sorts.findIndex((s) => s.property === active.id);
        const newIndex = sorts.findIndex((s) => s.property === over.id);
        updateSorts(arrayMove(sorts, oldIndex, newIndex));
      }
    },
    [sorts, updateSorts]
  );

  const handleUpdateSort = useCallback(
    (propertyId: string, updates: Partial<SortQuery>) => {
      const updatedSorts = sorts.map((sort) =>
        sort.property === propertyId ? { ...sort, ...updates } : sort
      );
      updateSorts(updatedSorts);
    },
    [sorts, updateSorts]
  );

  const handleRemoveSort = useCallback(
    (propertyId: string) => {
      updateSorts(sorts.filter((s) => s.property !== propertyId));
    },
    [sorts, updateSorts]
  );

  const handleDeleteAll = useCallback(() => {
    clearSort();
    onSortsChange?.([]);
    onDeleteAll?.();
  }, [clearSort, onSortsChange, onDeleteAll]);

  return (
    <div className="flex flex-col gap-1">
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <SortableContext items={sortIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2 py-2 pl-1">
            {sorts.map((sort) => {
              const property = properties.find((p) => p.id === sort.property);
              if (!property) {
                return null;
              }

              return (
                <SortEditor
                  key={sort.property}
                  onRemove={() => handleRemoveSort(sort.property)}
                  onUpdate={(updates) =>
                    handleUpdateSort(sort.property, updates)
                  }
                  properties={properties}
                  property={property}
                  sort={sort}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex flex-col">
        <Popover onOpenChange={setAddPickerOpen} open={addPickerOpen}>
          <PopoverTrigger
            className="w-full justify-start text-muted-foreground"
            render={<Button variant="ghost" />}
          >
            <PlusIcon />
            Add sort
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-0">
            <SortPicker
              addSort={addSort}
              onSelect={() => setAddPickerOpen(false)}
              properties={properties}
            />
          </PopoverContent>
        </Popover>

        <Button
          className="justify-start"
          onClick={handleDeleteAll}
          variant="destructive"
        >
          <Trash2Icon />
          <span>Delete sort</span>
        </Button>
      </div>
    </div>
  );
}

export { SortBulkEditor, type SortBulkEditorProps };
