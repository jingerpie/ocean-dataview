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
import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ocean-dataview/dataview/components/ui/popover";
import { AddSortButton } from "@ocean-dataview/dataview/components/ui/sort/add-sort-button";
import { SortRule } from "@ocean-dataview/dataview/components/ui/sort/sort-rule";
import { useSortBuilder } from "@ocean-dataview/dataview/hooks";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { PropertySort } from "@ocean-dataview/shared/types";
import { ChevronDownIcon, SortAscIcon, Trash2Icon } from "lucide-react";
import { useCallback, useMemo } from "react";

interface SortChipProps<T> {
	/** Current sort rules */
	sorts: PropertySort<T>[];
	/** Available properties to sort by */
	properties: DataViewProperty<T>[];
	/** Callback when sorts change */
	onSortsChange: (sorts: PropertySort<T>[]) => void;
}

/**
 * Sort chip that shows sort count and opens the sort builder.
 * Appearance: [↕ N sorts ▾]
 *
 * Uses global Zustand store for popover state coordination with toolbar buttons.
 */
export function SortChip<T>({
	sorts,
	properties,
	onSortsChange,
}: SortChipProps<T>) {
	const { isOpen, setOpen } = useSortBuilder();

	const sortText = sorts.length === 1 ? "1 sort" : `${sorts.length} sorts`;

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const sortIds = useMemo(
		() => sorts.map((s) => s.property as string),
		[sorts]
	);

	const onDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			if (over && active.id !== over.id) {
				const oldIndex = sorts.findIndex((s) => s.property === active.id);
				const newIndex = sorts.findIndex((s) => s.property === over.id);
				onSortsChange(arrayMove(sorts, oldIndex, newIndex));
			}
		},
		[sorts, onSortsChange]
	);

	const onSortAdd = useCallback(
		(prop: string) => {
			const newSort: PropertySort<T> = {
				property: prop as PropertySort<T>["property"],
				desc: false,
			};
			onSortsChange([...sorts, newSort]);
		},
		[sorts, onSortsChange]
	);

	const onSortUpdate = useCallback(
		(prop: string, updates: Partial<PropertySort<T>>) => {
			const updatedSorts = sorts.map((sort) =>
				sort.property === prop ? { ...sort, ...updates } : sort
			);
			onSortsChange(updatedSorts);
		},
		[sorts, onSortsChange]
	);

	const onSortRemove = useCallback(
		(prop: string) => {
			const updatedSorts = sorts.filter((s) => s.property !== prop);
			onSortsChange(updatedSorts);
		},
		[sorts, onSortsChange]
	);

	// Handle deleting all sorts
	const handleDeleteSort = () => {
		onSortsChange([]);
		setOpen(false);
	};

	// Get properties not already in sort list
	const availableProperties = properties.filter(
		(prop) => !sorts.some((sort) => sort.property === prop.id)
	);

	return (
		<Popover onOpenChange={setOpen} open={isOpen}>
			<PopoverTrigger render={<Button size="sm" variant="secondary" />}>
				<SortAscIcon />
				<span>{sortText}</span>
				<ChevronDownIcon />
			</PopoverTrigger>
			<PopoverContent align="start" className="w-80 p-1">
				<div className="flex flex-col gap-1">
					{/* Sort Rules with DnD */}
					{sorts.length > 0 && (
						<DndContext
							collisionDetection={closestCenter}
							onDragEnd={onDragEnd}
							sensors={sensors}
						>
							<SortableContext
								items={sortIds}
								strategy={verticalListSortingStrategy}
							>
								<div className="flex flex-col gap-2 pt-2 pl-1">
									{sorts.map((sort) => {
										const property = properties.find(
											(p) => p.id === sort.property
										);
										if (!property) {
											return null;
										}

										return (
											<SortRule
												key={sort.property}
												onRemove={() => onSortRemove(sort.property as string)}
												onUpdate={(updates) =>
													onSortUpdate(sort.property as string, updates)
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
					)}

					<div className="flex flex-col">
						{/* Add Sort Button */}
						{availableProperties.length > 0 && (
							<AddSortButton
								onSelect={onSortAdd}
								properties={availableProperties}
							/>
						)}

						{/* Delete Sort */}
						<Button
							className="justify-start"
							onClick={handleDeleteSort}
							size="sm"
							variant="ghost-destructive"
						>
							<Trash2Icon />
							<span>Delete sort</span>
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export type { SortChipProps };
