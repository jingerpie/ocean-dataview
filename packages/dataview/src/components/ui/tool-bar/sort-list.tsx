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
import type { PropertySort } from "@ocean-dataview/shared/types";
import { ArrowDownAZ, ArrowUpZA, Check, Plus, SortAsc, X } from "lucide-react";
import * as React from "react";

interface SortListProps<T> {
	properties: DataViewProperty<T>[];
	sorts: PropertySort<T>[];
	onSortsChange: (sorts: PropertySort<T>[]) => void;
	align?: "start" | "center" | "end";
}

/**
 * Sort popover with list of sort rules
 * Features:
 * - Add sort button
 * - Field selector (Command)
 * - Direction toggle (Asc/Desc)
 * - Remove button
 */
export function SortList<T>({
	properties,
	sorts,
	onSortsChange,
	align = "end",
}: SortListProps<T>) {
	const [open, setOpen] = React.useState(false);

	const onSortAdd = React.useCallback(
		(propertyId: string) => {
			const newSort: PropertySort<T> = {
				propertyId: propertyId as PropertySort<T>["propertyId"],
				desc: false,
			};
			onSortsChange([...sorts, newSort]);
		},
		[sorts, onSortsChange],
	);

	const onSortUpdate = React.useCallback(
		(index: number, updates: Partial<PropertySort<T>>) => {
			const updatedSorts = sorts.map((sort, i) =>
				i === index ? { ...sort, ...updates } : sort,
			);
			onSortsChange(updatedSorts);
		},
		[sorts, onSortsChange],
	);

	const onSortRemove = React.useCallback(
		(index: number) => {
			const updatedSorts = sorts.filter((_, i) => i !== index);
			onSortsChange(updatedSorts);
		},
		[sorts, onSortsChange],
	);

	// Get properties not already in sort list
	const availableProperties = properties.filter(
		(prop) => !sorts.some((sort) => sort.propertyId === prop.id),
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						variant="outline"
						size="sm"
						className="h-8"
						role="combobox"
						aria-expanded={open}
						aria-label="Show sort menu"
					/>
				}
			>
				<SortAsc className="h-4 w-4" />
				Sort
				{sorts.length > 0 && (
					<span className="ml-1 rounded-full bg-primary px-1.5 text-primary-foreground text-xs">
						{sorts.length}
					</span>
				)}
			</PopoverTrigger>
			<PopoverContent align={align} className="w-72 p-0">
				<div className="flex flex-col gap-2 p-3">
					{/* Sort Items */}
					{sorts.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							No sort rules applied
						</p>
					) : (
						<div className="flex flex-col gap-2">
							{sorts.map((sort, index) => {
								const property = properties.find(
									(p) => p.id === sort.propertyId,
								);
								if (!property) return null;

								return (
									<SortItem
										key={`${sort.propertyId}-${index}`}
										sort={sort}
										property={property}
										properties={properties}
										onUpdate={(updates) => onSortUpdate(index, updates)}
										onRemove={() => onSortRemove(index)}
									/>
								);
							})}
						</div>
					)}

					{/* Add Sort Button */}
					{availableProperties.length > 0 && (
						<AddSortButton
							properties={availableProperties}
							onSelect={onSortAdd}
						/>
					)}

					{/* Clear All */}
					{sorts.length > 0 && (
						<Button
							variant="ghost"
							size="sm"
							className="w-full justify-start text-destructive hover:text-destructive"
							onClick={() => onSortsChange([])}
						>
							<X className="mr-2 h-4 w-4" />
							Clear all sorts
						</Button>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}

interface SortItemProps<T> {
	sort: PropertySort<T>;
	property: DataViewProperty<T>;
	properties: DataViewProperty<T>[];
	onUpdate: (updates: Partial<PropertySort<T>>) => void;
	onRemove: () => void;
}

function SortItem<T>({
	sort,
	property,
	properties,
	onUpdate,
	onRemove,
}: SortItemProps<T>) {
	const [showFieldSelector, setShowFieldSelector] = React.useState(false);

	return (
		<div className="flex items-center gap-2 rounded-md bg-muted/50 p-1">
			{/* Field Selector */}
			<Popover open={showFieldSelector} onOpenChange={setShowFieldSelector}>
				<PopoverTrigger
					render={
						<Button
							variant="ghost"
							size="sm"
							className="h-7 flex-1 justify-start px-2 font-normal"
						/>
					}
				>
					<span className="truncate">{property.label ?? property.id}</span>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-48 p-0">
					<Command loop>
						<CommandInput placeholder="Search fields..." />
						<CommandList>
							<CommandEmpty>No fields found.</CommandEmpty>
							<CommandGroup>
								{properties.map((prop) => (
									<CommandItem
										key={prop.id}
										value={prop.id}
										onSelect={() => {
											onUpdate({
												propertyId: prop.id as PropertySort<T>["propertyId"],
											});
											setShowFieldSelector(false);
										}}
									>
										<span className="truncate">{prop.label ?? prop.id}</span>
										<Check
											className={cn(
												"ml-auto",
												prop.id === sort.propertyId
													? "opacity-100"
													: "opacity-0",
											)}
										/>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{/* Direction Toggle */}
			<Button
				variant="ghost"
				size="sm"
				className="h-7 w-7 p-0"
				onClick={() => onUpdate({ desc: !sort.desc })}
				aria-label={sort.desc ? "Sort descending" : "Sort ascending"}
			>
				{sort.desc ? (
					<ArrowUpZA className="h-4 w-4" />
				) : (
					<ArrowDownAZ className="h-4 w-4" />
				)}
			</Button>

			{/* Remove Button */}
			<Button
				variant="ghost"
				size="sm"
				className="h-7 w-7 p-0"
				onClick={onRemove}
				aria-label="Remove sort"
			>
				<X className="h-4 w-4" />
			</Button>
		</div>
	);
}

interface AddSortButtonProps<T> {
	properties: DataViewProperty<T>[];
	onSelect: (propertyId: string) => void;
}

function AddSortButton<T>({ properties, onSelect }: AddSortButtonProps<T>) {
	const [open, setOpen] = React.useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						variant="outline"
						size="sm"
						className="h-8 w-full justify-start"
					/>
				}
			>
				<Plus className="mr-2 h-4 w-4" />
				Add sort
			</PopoverTrigger>
			<PopoverContent align="start" className="w-48 p-0">
				<Command loop>
					<CommandInput placeholder="Search fields..." />
					<CommandList>
						<CommandEmpty>No fields found.</CommandEmpty>
						<CommandGroup>
							{properties.map((property) => (
								<CommandItem
									key={property.id}
									value={property.id}
									onSelect={() => {
										onSelect(property.id);
										setOpen(false);
									}}
								>
									<span className="truncate">
										{property.label ?? property.id}
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

export type { SortListProps };
