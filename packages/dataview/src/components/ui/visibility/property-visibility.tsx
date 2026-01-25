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
import type { PropertyMeta } from "@ocean-dataview/dataview/types";
import { Settings2 } from "lucide-react";
import { useDataViewContext } from "../../../lib/providers/data-view-context";

export interface DataViewOptionsProps {
	/**
	 * Trigger variant:
	 * - `default` - Icon + text, outline button
	 * - `icon` - Icon only, ghost button
	 */
	variant?: "default" | "icon";
}

/**
 * Property visibility picker with Combobox.
 *
 * Trigger Variants:
 * - `default` - Settings icon with "Properties" label, outline button
 * - `icon` - Settings icon only, ghost button
 */
export function DataViewOptions({
	variant = "default",
}: DataViewOptionsProps = {}) {
	const {
		propertyMetas,
		propertyVisibility,
		excludedPropertyIds,
		setPropertyVisibility,
	} = useDataViewContext();

	// Filter out:
	// 1. Properties with visibility: false
	// 2. Excluded property IDs (e.g., grouped column)
	const availableProperties = propertyMetas.filter(
		(property) =>
			property.visibility !== false &&
			!excludedPropertyIds.some((id) => id === property.id)
	);

	const selectedProperties = availableProperties.filter((property) =>
		propertyVisibility.some((id) => id === property.id)
	);

	// Render trigger based on variant
	const renderTrigger = () => {
		if (variant === "icon") {
			return (
				<ComboboxTrigger
					render={<Button size="icon-sm" variant="ghost" />}
					showChevron={false}
				>
					<Settings2 />
				</ComboboxTrigger>
			);
		}

		// default variant
		return (
			<ComboboxTrigger render={<Button size="sm" variant="outline" />}>
				<Settings2 />
				<span>Properties</span>
			</ComboboxTrigger>
		);
	};

	return (
		<Combobox
			items={availableProperties}
			multiple
			onValueChange={(newSelection) => {
				const newArray = (newSelection ?? []) as PropertyMeta[];
				setPropertyVisibility(newArray.map((p) => String(p.id)));
			}}
			value={selectedProperties}
		>
			{renderTrigger()}
			<ComboboxContent align="end" className="w-44">
				<ComboboxInput placeholder="Search columns..." showTrigger={false} />
				<ComboboxEmpty>No columns found.</ComboboxEmpty>
				<ComboboxList>
					{(property) => (
						<ComboboxItem key={String(property.id)} value={property}>
							{property.label ?? String(property.id)}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}
