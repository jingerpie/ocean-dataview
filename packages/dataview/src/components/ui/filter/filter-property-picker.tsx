"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxSeparator,
	ComboboxTrigger,
	ComboboxValue,
} from "@ocean-dataview/dataview/components/ui/combobox";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import { ListFilterIcon, PlusIcon } from "lucide-react";

interface FilterPropertyPickerProps<T> {
	/** Available properties to filter by */
	properties: DataViewProperty<T>[];
	/** Currently selected property (for selector variant) */
	value?: DataViewProperty<T>;
	/** Controlled open state */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Callback when a property is selected */
	onSelect: (property: DataViewProperty<T>) => void;
	/** Callback when "Add advanced filter" is clicked (not shown for selector variant) */
	onAdvancedFilter?: () => void;
	/** Trigger variant */
	variant?: "default" | "add" | "selector";
	/** Property IDs to exclude from the list (e.g., already used in simple filters) */
	excludePropertyIds?: string[];
}

/**
 * Filter property picker with Combobox.
 *
 * Variants:
 * - `default` - Filter icon with label (for toolbar when no filter exists)
 * - `add` - Plus icon with label (for adding another filter)
 * - `selector` - Shows selected value (for changing property in existing rule)
 */
function FilterPropertyPicker<T>({
	properties,
	value,
	open,
	onOpenChange,
	onSelect,
	onAdvancedFilter,
	variant = "default",
	excludePropertyIds,
}: FilterPropertyPickerProps<T>) {
	// Filter out excluded properties
	const availableProperties = excludePropertyIds
		? properties.filter((p) => !excludePropertyIds.includes(String(p.id)))
		: properties;

	// Find matching property from items for selector variant
	const selectedProperty = value
		? properties.find((p) => p.id === value.id)
		: undefined;

	// Render trigger based on variant
	const renderTrigger = () => {
		if (variant === "selector") {
			return (
				<ComboboxTrigger
					render={<Button variant="outline" size="sm" />}
					className="min-w-28 justify-between"
				>
					<ComboboxValue>
						{selectedProperty
							? (selectedProperty.label ?? String(selectedProperty.id))
							: "Select property..."}
					</ComboboxValue>
				</ComboboxTrigger>
			);
		}

		const TriggerIcon = variant === "add" ? PlusIcon : ListFilterIcon;
		return (
			<ComboboxTrigger render={<Button variant="ghost" size="sm" />}>
				<TriggerIcon />
				<span>Filter</span>
			</ComboboxTrigger>
		);
	};

	// Compute value - use null instead of undefined to keep component in controlled mode
	// Type assertion needed because base-ui Combobox has complex generic inference with union types
	const comboboxValue = (
		variant === "selector" ? (selectedProperty ?? null) : null
	) as never;

	return (
		<Combobox
			items={availableProperties}
			value={comboboxValue}
			open={open}
			onOpenChange={onOpenChange}
			onValueChange={(newValue) => {
				if (newValue) {
					onSelect(newValue as DataViewProperty<T>);
				}
			}}
		>
			{renderTrigger()}
			<ComboboxContent align="start" className="flex w-56 flex-col">
				<ComboboxInput showTrigger={false} placeholder="Filter by..." />
				<ComboboxEmpty>No properties found.</ComboboxEmpty>
				<ComboboxList>
					{(property) => (
						<ComboboxItem key={String(property.id)} value={property}>
							{property.label ?? String(property.id)}
						</ComboboxItem>
					)}
				</ComboboxList>
				{onAdvancedFilter && (
					<>
						<ComboboxSeparator className="my-0" />
						<Button
							variant="ghost"
							size="sm"
							className="my-1 w-full justify-start"
							onClick={() => {
								onOpenChange?.(false);
								onAdvancedFilter();
							}}
						>
							<PlusIcon />
							<span>Add advanced filter</span>
						</Button>
					</>
				)}
			</ComboboxContent>
		</Combobox>
	);
}

export { FilterPropertyPicker, type FilterPropertyPickerProps };
