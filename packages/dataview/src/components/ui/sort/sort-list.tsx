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
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
	ComboboxValue,
} from "@ocean-dataview/dataview/components/ui/combobox";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ocean-dataview/dataview/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ocean-dataview/dataview/components/ui/select";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { PropertySort } from "@ocean-dataview/shared/types";
import { GripVertical, Plus, SortAsc, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

interface SortListProps<T> {
	properties: DataViewProperty<T>[];
	sorts: PropertySort<T>[];
	onSortsChange: (sorts: PropertySort<T>[]) => void;
	align?: "start" | "center" | "end";
	/**
	 * Trigger variant:
	 * - `default` - Icon + text, outline button
	 * - `icon` - Icon only, ghost button
	 */
	variant?: "default" | "icon";
}

/**
 * Sort popover with list of sort rules (Notion-style)
 * Features:
 * - Drag-and-drop reordering
 * - Field selector dropdown
 * - Direction dropdown (Ascending/Descending)
 * - Add/remove sort rules
 */
export function SortList<T>({
	properties,
	sorts,
	onSortsChange,
	align = "end",
	variant = "default",
}: SortListProps<T>) {
	const [open, setOpen] = useState(false);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const sortIds = useMemo(
		() => sorts.map((s) => s.propertyId as string),
		[sorts]
	);

	const onDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			if (over && active.id !== over.id) {
				const oldIndex = sorts.findIndex((s) => s.propertyId === active.id);
				const newIndex = sorts.findIndex((s) => s.propertyId === over.id);
				onSortsChange(arrayMove(sorts, oldIndex, newIndex));
			}
		},
		[sorts, onSortsChange]
	);

	const onSortAdd = useCallback(
		(propertyId: string) => {
			const newSort: PropertySort<T> = {
				propertyId: propertyId as PropertySort<T>["propertyId"],
				desc: false,
			};
			onSortsChange([...sorts, newSort]);
		},
		[sorts, onSortsChange]
	);

	const onSortUpdate = useCallback(
		(propertyId: string, updates: Partial<PropertySort<T>>) => {
			const updatedSorts = sorts.map((sort) =>
				sort.propertyId === propertyId ? { ...sort, ...updates } : sort
			);
			onSortsChange(updatedSorts);
		},
		[sorts, onSortsChange]
	);

	const onSortRemove = useCallback(
		(propertyId: string) => {
			const updatedSorts = sorts.filter((s) => s.propertyId !== propertyId);
			onSortsChange(updatedSorts);
		},
		[sorts, onSortsChange]
	);

	// Get properties not already in sort list
	const availableProperties = properties.filter(
		(prop) => !sorts.some((sort) => sort.propertyId === prop.id)
	);

	// Render trigger based on variant
	const renderTrigger = () => {
		if (variant === "icon") {
			return (
				<PopoverTrigger
					render={
						<Button
							aria-expanded={open}
							aria-label="Show sort menu"
							role="combobox"
							size="icon-sm"
							variant="ghost"
						/>
					}
				>
					<SortAsc className="h-4 w-4" />
				</PopoverTrigger>
			);
		}

		// default variant
		return (
			<PopoverTrigger
				render={
					<Button
						aria-expanded={open}
						aria-label="Show sort menu"
						role="combobox"
						size="sm"
						variant="outline"
					/>
				}
			>
				<SortAsc className="h-4 w-4" />
				{sorts.length > 0 ? (
					<span>
						{sorts.length} sort{sorts.length > 1 ? "s" : ""}
					</span>
				) : (
					<span>Sort</span>
				)}
			</PopoverTrigger>
		);
	};

	return (
		<Popover onOpenChange={setOpen} open={open}>
			{renderTrigger()}
			<PopoverContent align={align} className="w-80 p-0">
				<div className="flex flex-col gap-2 p-3">
					{/* Sort Items with DnD */}
					{sorts.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							No sort rules applied
						</p>
					) : (
						<DndContext
							collisionDetection={closestCenter}
							onDragEnd={onDragEnd}
							sensors={sensors}
						>
							<SortableContext
								items={sortIds}
								strategy={verticalListSortingStrategy}
							>
								<div className="flex flex-col gap-1">
									{sorts.map((sort) => {
										const property = properties.find(
											(p) => p.id === sort.propertyId
										);
										if (!property) {
											return null;
										}

										return (
											<SortableItem
												key={sort.propertyId}
												onRemove={() => onSortRemove(sort.propertyId as string)}
												onUpdate={(updates) =>
													onSortUpdate(sort.propertyId as string, updates)
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

					{/* Add Sort Button */}
					{availableProperties.length > 0 && (
						<AddSortButton
							onSelect={onSortAdd}
							properties={availableProperties}
						/>
					)}

					{/* Delete Sort (Clear All) */}
					{sorts.length > 0 && (
						<Button
							className="w-full justify-start text-muted-foreground hover:text-destructive"
							onClick={() => onSortsChange([])}
							size="sm"
							variant="ghost"
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Delete sort
						</Button>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}

interface SortItemProps<T> {
	sort: PropertySort<T>;
	property: DataViewProperty<T>;
	properties: DataViewProperty<T>[];
	onUpdate: (updates: Partial<PropertySort<T>>) => void;
	onRemove: () => void;
}

function SortableItem<T>(props: SortItemProps<T>) {
	const { sort } = props;
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: sort.propertyId as string });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			className={cn(
				"flex items-center gap-1 rounded-md bg-muted/50 p-1",
				isDragging && "opacity-50"
			)}
			ref={setNodeRef}
			style={style}
		>
			{/* Drag Handle */}
			<button
				className="cursor-grab touch-none rounded p-0.5 hover:bg-muted"
				type="button"
				{...attributes}
				{...listeners}
			>
				<GripVertical className="h-4 w-4 text-muted-foreground" />
			</button>

			<SortItemContent {...props} />
		</div>
	);
}

function SortItemContent<T>({
	sort,
	property,
	properties,
	onUpdate,
	onRemove,
}: SortItemProps<T>) {
	const [open, setOpen] = useState(false);

	return (
		<>
			{/* Field Selector */}
			<Combobox
				items={properties}
				onOpenChange={setOpen}
				onValueChange={(newProperty) => {
					if (newProperty) {
						onUpdate({
							propertyId: (newProperty as DataViewProperty<T>)
								.id as PropertySort<T>["propertyId"],
						});
					}
				}}
				open={open}
				value={property as never}
			>
				<ComboboxTrigger
					className="h-7 flex-1 justify-start px-2"
					render={<Button size="sm" variant="ghost" />}
				>
					<ComboboxValue>
						<span className="truncate">{property.label ?? property.id}</span>
					</ComboboxValue>
				</ComboboxTrigger>
				<ComboboxContent align="start" className="w-48">
					<ComboboxInput placeholder="Search fields..." showTrigger={false} />
					<ComboboxEmpty>No fields found.</ComboboxEmpty>
					<ComboboxList>
						{(prop) => (
							<ComboboxItem
								data-checked={prop.id === sort.propertyId}
								key={String(prop.id)}
								value={prop}
							>
								<span className="truncate">{prop.label ?? prop.id}</span>
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>

			{/* Direction Dropdown */}
			<Select
				onValueChange={(value) => onUpdate({ desc: value === "desc" })}
				value={sort.desc ? "desc" : "asc"}
			>
				<SelectTrigger className="h-7 w-28">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="asc">Ascending</SelectItem>
					<SelectItem value="desc">Descending</SelectItem>
				</SelectContent>
			</Select>

			{/* Remove Button */}
			<Button
				aria-label="Remove sort"
				className="h-7 w-7"
				onClick={onRemove}
				size="icon-sm"
				variant="ghost"
			>
				<span className="text-muted-foreground hover:text-foreground">×</span>
			</Button>
		</>
	);
}

interface AddSortButtonProps<T> {
	properties: DataViewProperty<T>[];
	onSelect: (propertyId: string) => void;
}

function AddSortButton<T>({ properties, onSelect }: AddSortButtonProps<T>) {
	const [open, setOpen] = useState(false);

	return (
		<Combobox
			items={properties}
			onOpenChange={setOpen}
			onValueChange={(property) => {
				if (property) {
					onSelect(String((property as DataViewProperty<T>).id));
					setOpen(false);
				}
			}}
			open={open}
			value={null as never}
		>
			<ComboboxTrigger
				className="w-full justify-start"
				render={<Button size="sm" variant="ghost" />}
				showChevron={false}
			>
				<Plus className="mr-2 h-4 w-4" />
				Add sort
			</ComboboxTrigger>
			<ComboboxContent align="start" className="w-48">
				<ComboboxInput placeholder="Search fields..." showTrigger={false} />
				<ComboboxEmpty>No fields found.</ComboboxEmpty>
				<ComboboxList>
					{(property) => (
						<ComboboxItem key={String(property.id)} value={property}>
							<span className="truncate">{property.label ?? property.id}</span>
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export type { SortListProps };
