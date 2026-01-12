"use client";

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@ocean-dataview/dataview/components/ui/command";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type * as React from "react";

interface PropertySelectorProps<T> {
	/** Available properties to select from */
	properties: DataViewProperty<T>[];
	/** Callback when a property is selected */
	onSelect: (property: DataViewProperty<T>) => void;
	/** Placeholder text for the search input */
	placeholder?: string;
	/** Optional footer content (e.g., "+ Add advanced filter") */
	footer?: React.ReactNode;
}

/**
 * Searchable property dropdown used by Filter and Sort buttons.
 */
export function PropertySelector<T>({
	properties,
	onSelect,
	placeholder = "Search...",
	footer,
}: PropertySelectorProps<T>) {
	return (
		<Command loop>
			<CommandInput placeholder={placeholder} />
			<CommandList>
				<CommandEmpty>No properties found.</CommandEmpty>
				<CommandGroup>
					{properties.map((property) => (
						<CommandItem
							key={String(property.id)}
							value={String(property.id)}
							onSelect={() => onSelect(property)}
						>
							<span className="truncate">
								{property.label ?? String(property.id)}
							</span>
						</CommandItem>
					))}
				</CommandGroup>
				{footer && (
					<>
						<CommandSeparator />
						<CommandGroup>{footer}</CommandGroup>
					</>
				)}
			</CommandList>
		</Command>
	);
}

export type { PropertySelectorProps };
