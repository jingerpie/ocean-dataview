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
import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { FilterCondition } from "@ocean-dataview/shared/types";
import { createDefaultCondition } from "@ocean-dataview/shared/utils";
import {
	ChevronDownIcon,
	ChevronLeftIcon,
	PlusIcon,
	SquareStackIcon,
} from "lucide-react";
import * as React from "react";

interface AddFilterButtonProps<T> {
	/** Available properties to filter on */
	properties: DataViewProperty<T>[];
	/** Whether adding a group is allowed (false at max depth) */
	canAddGroup: boolean;
	/** Callback when a new rule is added */
	onAddRule: (condition: FilterCondition) => void;
	/** Callback when a new group is added */
	onAddGroup: () => void;
	/** Additional class names */
	className?: string;
}

/**
 * Button to add a new filter rule or group.
 * Uses a single popover with different views:
 * - "menu": Shows options to add rule or group
 * - "properties": Shows property selector
 */
export function AddFilterButton<T>({
	properties,
	canAddGroup,
	onAddRule,
	onAddGroup,
	className,
}: AddFilterButtonProps<T>) {
	const [open, setOpen] = React.useState(false);
	const [view, setView] = React.useState<"menu" | "properties">("menu");

	const handleSelectProperty = (propertyId: string) => {
		const condition = createDefaultCondition(propertyId);
		onAddRule(condition);
		setOpen(false);
		setView("menu");
	};

	const handleAddGroup = () => {
		onAddGroup();
		setOpen(false);
		setView("menu");
	};

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			// Reset view when closing
			setView("menu");
		}
	};

	// If can add group, show menu with options
	if (canAddGroup) {
		return (
			<Popover open={open} onOpenChange={handleOpenChange}>
				<PopoverTrigger
					render={
						<Button
							variant="ghost"
							size="sm"
							className={cn("h-7 gap-1 px-2 text-muted-foreground", className)}
						>
							<PlusIcon className="size-3.5" />
							<span>Add filter rule</span>
							<ChevronDownIcon className="size-3 opacity-50" />
						</Button>
					}
				/>
				<PopoverContent align="start" className="w-56 p-0">
					{view === "menu" ? (
						<div className="py-1">
							{/* Add Filter Rule */}
							<button
								type="button"
								className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
								onClick={() => setView("properties")}
							>
								<PlusIcon className="size-4" />
								<span>Add filter rule</span>
							</button>

							{/* Add Filter Group */}
							<button
								type="button"
								className="flex w-full flex-col items-start px-3 py-2 text-sm hover:bg-accent"
								onClick={handleAddGroup}
							>
								<div className="flex items-center gap-2">
									<SquareStackIcon className="size-4" />
									<span>Add filter group</span>
								</div>
								<span className="ml-6 text-muted-foreground text-xs">
									A group to nest more filters
								</span>
							</button>
						</div>
					) : (
						<div>
							{/* Back button */}
							<button
								type="button"
								className="flex w-full items-center gap-1 border-b px-2 py-1.5 text-muted-foreground text-xs hover:bg-accent"
								onClick={() => setView("menu")}
							>
								<ChevronLeftIcon className="size-3" />
								<span>Back</span>
							</button>
							<Command loop>
								<CommandInput placeholder="Search properties..." />
								<CommandList>
									<CommandEmpty>No properties found.</CommandEmpty>
									<CommandGroup>
										{properties.map((prop) => (
											<CommandItem
												key={String(prop.id)}
												value={String(prop.id)}
												onSelect={() => handleSelectProperty(String(prop.id))}
											>
												<span className="truncate">
													{prop.label ?? String(prop.id)}
												</span>
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</div>
					)}
				</PopoverContent>
			</Popover>
		);
	}

	// At max depth, show simple button with property selector
	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger
				render={
					<Button
						variant="ghost"
						size="sm"
						className={cn("h-7 gap-1 px-2 text-muted-foreground", className)}
					>
						<PlusIcon className="size-3.5" />
						<span>Add filter rule</span>
					</Button>
				}
			/>
			<PopoverContent align="start" className="w-48 p-0">
				<Command loop>
					<CommandInput placeholder="Search properties..." />
					<CommandList>
						<CommandEmpty>No properties found.</CommandEmpty>
						<CommandGroup>
							{properties.map((prop) => (
								<CommandItem
									key={String(prop.id)}
									value={String(prop.id)}
									onSelect={() => handleSelectProperty(String(prop.id))}
								>
									<span className="truncate">
										{prop.label ?? String(prop.id)}
									</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

export type { AddFilterButtonProps };
