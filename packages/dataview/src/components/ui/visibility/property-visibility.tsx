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
import { Settings2 } from "lucide-react";
import { useMemo } from "react";
import { useDataViewContext } from "../../../lib/providers/data-view-context";

interface PropertyLike {
	id: string | number;
	label?: string;
}

interface ColumnItem {
	id: string;
	label: string;
	isVisible: boolean;
}

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
		properties,
		propertyVisibility,
		excludedPropertyIds,
		toggleProperty,
	} = useDataViewContext();

	const columns = useMemo(
		() =>
			(properties as readonly PropertyLike[])
				.filter(
					(property) => !excludedPropertyIds.some((id) => id === property.id)
				)
				.map((property) => ({
					id: String(property.id),
					label: property.label ?? String(property.id),
					isVisible: propertyVisibility.some((id) => id === property.id),
				})),
		[properties, propertyVisibility, excludedPropertyIds]
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
			items={columns}
			onValueChange={(column) => {
				if (column) {
					const propertyId = (properties as readonly PropertyLike[]).find(
						(p) => String(p.id) === (column as ColumnItem).id
					)?.id;
					if (propertyId !== undefined) {
						toggleProperty(propertyId as string);
					}
				}
			}}
			value={null as never}
		>
			{renderTrigger()}
			<ComboboxContent align="end" className="w-44">
				<ComboboxInput placeholder="Search columns..." showTrigger={false} />
				<ComboboxEmpty>No columns found.</ComboboxEmpty>
				<ComboboxList>
					{(column) => (
						<ComboboxItem
							data-checked={column.isVisible}
							key={column.id}
							value={column}
						>
							{column.label}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}
