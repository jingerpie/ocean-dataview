"use client";

import { useSortable } from "@dnd-kit/sortable";
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
import { PropertyIcon } from "@ocean-dataview/dataview/components/ui/property-icon";
import { DirectionPicker } from "@ocean-dataview/dataview/components/ui/sort/direction-picker";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { PropertySort } from "@ocean-dataview/shared/types";
import { GripVerticalIcon, X } from "lucide-react";
import { useState } from "react";

interface SortRuleProps<T> {
	/** The sort rule */
	sort: PropertySort<T>;
	/** The current property for this sort */
	property: DataViewProperty<T>;
	/** All available properties */
	properties: DataViewProperty<T>[];
	/** Callback when sort rule changes */
	onUpdate: (updates: Partial<PropertySort<T>>) => void;
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
function SortRule<T>({
	sort,
	property,
	properties,
	onUpdate,
	onRemove,
	draggable = true,
	className,
}: SortRuleProps<T>) {
	const [open, setOpen] = useState(false);

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: sort.property as string,
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
				<Combobox
					items={properties}
					onOpenChange={setOpen}
					onValueChange={(newProperty) => {
						if (newProperty) {
							onUpdate({
								property: (newProperty as DataViewProperty<T>)
									.id as PropertySort<T>["property"],
							});
						}
					}}
					open={open}
					value={property as never}
				>
					<ComboboxTrigger render={<Button size="sm" variant="outline" />}>
						<ComboboxValue>
							<PropertyIcon type={property.type} />
							<span className="truncate">{property.label ?? property.id}</span>
						</ComboboxValue>
					</ComboboxTrigger>
					<ComboboxContent align="start" className="w-48">
						<ComboboxInput placeholder="Search fields..." showTrigger={false} />
						<ComboboxEmpty>No fields found.</ComboboxEmpty>
						<ComboboxList>
							{(prop) => (
								<ComboboxItem
									data-checked={prop.id === sort.property}
									key={String(prop.id)}
									value={prop}
								>
									<PropertyIcon type={prop.type} />
									<span className="truncate">{prop.label ?? prop.id}</span>
								</ComboboxItem>
							)}
						</ComboboxList>
					</ComboboxContent>
				</Combobox>

				{/* Direction Picker */}
				<DirectionPicker
					onValueChange={(desc) => onUpdate({ desc })}
					value={sort.desc}
				/>
			</div>
			{/* Remove Button */}
			<Button
				aria-label="Remove sort"
				onClick={onRemove}
				size="icon-sm"
				variant="ghost"
			>
				<X />
			</Button>
		</div>
	);
}

export { SortRule, type SortRuleProps };
