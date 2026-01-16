"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@ocean-dataview/dataview/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ocean-dataview/dataview/components/ui/popover";
import { ChevronsUpDown, Settings2 } from "lucide-react";
import { useMemo } from "react";
import { useDataViewContext } from "../../../lib/providers/data-view-context";

interface PropertyLike {
	id: string | number;
	label?: string;
}

export interface DataViewOptionsProps {
	variant?: "default" | "icon";
}

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

	return (
		<Popover>
			{variant === "icon" ? (
				<PopoverTrigger
					render={
						<Button
							aria-label="Toggle columns"
							className="h-8 w-8 p-0"
							role="combobox"
							size="sm"
							variant="outline"
						/>
					}
				>
					<Settings2 className="h-4 w-4" />
				</PopoverTrigger>
			) : (
				<PopoverTrigger
					render={
						<Button
							aria-label="Toggle columns"
							className="hidden h-8 lg:flex"
							role="combobox"
							size="sm"
							variant="outline"
						/>
					}
				>
					<Settings2 />
					Property
					<ChevronsUpDown className="ml-auto opacity-50" />
				</PopoverTrigger>
			)}
			<PopoverContent align="end" className="w-44 p-0">
				<Command>
					<CommandInput placeholder="Search columns..." />
					<CommandList>
						<CommandEmpty>No columns found.</CommandEmpty>
						<CommandGroup>
							{columns.map((column) => {
								const propertyId = (properties as readonly PropertyLike[]).find(
									(p) => String(p.id) === column.id
								)?.id;
								return (
									<CommandItem
										data-checked={column.isVisible}
										key={column.id}
										onSelect={() => {
											if (propertyId !== undefined) {
												toggleProperty(propertyId as string);
											}
										}}
										value={column.id}
									>
										{column.label}
									</CommandItem>
								);
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
