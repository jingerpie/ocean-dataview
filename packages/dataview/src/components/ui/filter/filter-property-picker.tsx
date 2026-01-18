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
	/** Currently selected property (for rule variant) */
	value?: DataViewProperty<T>;
	/** Controlled open state */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Callback when a property is selected */
	onSelect: (property: DataViewProperty<T>) => void;
	/** Callback when "Add advanced filter" is clicked (only shown when advance=false) */
	onAdvancedFilter?: () => void;
	/**
	 * Trigger variant:
	 * - `default` - Filter icon with "Filter" label
	 * - `icon` - Plus icon only (compact)
	 * - `rule` - Shows selected property value (for changing property in existing rule)
	 */
	variant?: "default" | "icon" | "rule";
	/**
	 * Advanced mode (for use inside advanced filter builder):
	 * - `true` - No "Add advanced filter" button, shows all properties
	 * - `false` - Shows "Add advanced filter" button, can exclude properties
	 */
	advance?: boolean;
	/** Property IDs to exclude from the list (only used when advance=false) */
	excludePropertyIds?: string[];
}

/**
 * Filter property picker with Combobox.
 *
 * Trigger Variants:
 * - `default` - Filter icon with "Filter" label (for toolbar)
 * - `icon` - Plus icon only (compact mode)
 * - `rule` - Shows selected property value (for existing filter rules)
 *
 * Content Modes:
 * - `advance=false` (default) - Shows "Add advanced filter" button, respects excludePropertyIds
 * - `advance=true` - No "Add advanced filter" button, shows all properties
 */
function FilterPropertyPicker<T>({
	properties,
	value,
	open,
	onOpenChange,
	onSelect,
	onAdvancedFilter,
	variant = "default",
	advance = false,
	excludePropertyIds,
}: FilterPropertyPickerProps<T>) {
	// Filter out excluded properties (only when not in advance mode)
	const availableProperties =
		!advance && excludePropertyIds
			? properties.filter((p) => !excludePropertyIds.includes(String(p.id)))
			: properties;

	// Find matching property from items for rule variant
	const selectedProperty = value
		? properties.find((p) => p.id === value.id)
		: undefined;

	// Render trigger based on variant
	const renderTrigger = () => {
		if (variant === "rule") {
			return (
				<ComboboxTrigger
					className="min-w-28 justify-between"
					render={<Button size="sm" variant="outline" />}
				>
					<ComboboxValue>
						{selectedProperty
							? (selectedProperty.label ?? String(selectedProperty.id))
							: "Select property..."}
					</ComboboxValue>
				</ComboboxTrigger>
			);
		}

		if (variant === "icon") {
			return (
				<ComboboxTrigger
					render={<Button size="icon-sm" variant="ghost" />}
					showChevron={false}
				>
					<PlusIcon />
				</ComboboxTrigger>
			);
		}

		// default variant
		return (
			<ComboboxTrigger render={<Button size="sm" variant="ghost" />}>
				<ListFilterIcon />
				<span>Filter</span>
			</ComboboxTrigger>
		);
	};

	// Show "Add advanced filter" button only when not in advance mode
	const showAdvancedFilterButton = !advance && onAdvancedFilter;

	// Compute value - use null instead of undefined to keep component in controlled mode
	// Type assertion needed because base-ui Combobox has complex generic inference with union types
	const comboboxValue = (
		variant === "rule" ? (selectedProperty ?? null) : null
	) as never;

	return (
		<Combobox
			items={availableProperties}
			onOpenChange={onOpenChange}
			onValueChange={(newValue) => {
				if (newValue) {
					onSelect(newValue as DataViewProperty<T>);
				}
			}}
			open={open}
			value={comboboxValue}
		>
			{renderTrigger()}
			<ComboboxContent align="start" className="flex w-56 flex-col">
				<ComboboxInput placeholder="Filter by..." showTrigger={false} />
				<ComboboxEmpty>No properties found.</ComboboxEmpty>
				<ComboboxList>
					{(property) => (
						<ComboboxItem key={String(property.id)} value={property}>
							{property.label ?? String(property.id)}
						</ComboboxItem>
					)}
				</ComboboxList>
				{showAdvancedFilterButton && (
					<>
						<ComboboxSeparator className="my-0" />
						<Button
							className="my-1 w-full justify-start"
							onClick={() => {
								onOpenChange?.(false);
								onAdvancedFilter();
							}}
							size="sm"
							variant="ghost"
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
