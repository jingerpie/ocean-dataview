"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
} from "@ocean-dataview/dataview/components/ui/combobox";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

interface AddSortButtonProps<T> {
	/** Available properties to sort by */
	properties: DataViewProperty<T>[];
	/** Callback when a property is selected */
	onSelect: (propertyId: string) => void;
	/** Additional class names */
	className?: string;
}

/**
 * Combobox button to add a new sort rule.
 *
 * Opens a searchable dropdown with available properties.
 */
function AddSortButton<T>({
	properties,
	onSelect,
	className,
}: AddSortButtonProps<T>) {
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
				className={cn("w-full justify-start text-muted-foreground", className)}
				render={<Button size="sm" variant="ghost" />}
				showChevron={false}
			>
				<PlusIcon />
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

export { AddSortButton, type AddSortButtonProps };
