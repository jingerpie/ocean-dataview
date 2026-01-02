"use client";

import { Button } from "@ocean-dataview/ui/components/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@ocean-dataview/ui/components/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ocean-dataview/ui/components/popover";
import { cn } from "@ocean-dataview/ui/lib/utils";
import { Check, ChevronsUpDown, Settings2 } from "lucide-react";
import * as React from "react";
import { useDataViewContext } from "./use-data-view-context";

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
	const columns = React.useMemo(
		() =>
			(properties as any[])
				.filter((property: any) => !excludedPropertyIds.includes(property.id))
				.map((property: any) => ({
					id: String(property.id),
					label: property.label ?? String(property.id),
					isVisible: propertyVisibility.includes(property.id),
				})),
		[properties, propertyVisibility, excludedPropertyIds],
	);

	return (
		<Popover>
			<PopoverTrigger asChild>
				{variant === "icon" ? (
					<Button
						aria-label="Toggle columns"
						role="combobox"
						variant="outline"
						size="sm"
						className="h-8 w-8 p-0"
					>
						<Settings2 className="h-4 w-4" />
					</Button>
				) : (
					<Button
						aria-label="Toggle columns"
						role="combobox"
						variant="outline"
						size="sm"
						className="hidden h-8 lg:flex"
					>
						<Settings2 />
						Property
						<ChevronsUpDown className="ml-auto opacity-50" />
					</Button>
				)}
			</PopoverTrigger>
			<PopoverContent align="end" className="w-44 p-0">
				<Command>
					<CommandInput placeholder="Search columns..." />
					<CommandList>
						<CommandEmpty>No columns found.</CommandEmpty>
						<CommandGroup>
							{columns.map((column: any) => {
								const propertyId = (properties as any[]).find(
									(p: any) => String(p.id) === column.id,
								)?.id;
								return (
									<CommandItem
										key={column.id}
										value={column.id}
										onSelect={() => {
											if (propertyId !== undefined) {
												toggleProperty(propertyId);
											}
										}}
									>
										<span className="truncate">{column.label}</span>
										<Check
											className={cn(
												"ml-auto size-4 shrink-0",
												column.isVisible ? "opacity-100" : "opacity-0",
											)}
										/>
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
