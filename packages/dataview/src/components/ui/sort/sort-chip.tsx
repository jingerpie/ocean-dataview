"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ocean-dataview/dataview/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ocean-dataview/dataview/components/ui/select";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { PropertySort } from "@ocean-dataview/shared/types";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	ChevronDownIcon,
	TrashIcon,
} from "lucide-react";
import * as React from "react";

interface SortChipProps<T> {
	/** Current sort configuration */
	sort: PropertySort<T>;
	/** Available properties */
	properties: DataViewProperty<T>[];
	/** Callback when sort changes */
	onSortChange: (sort: PropertySort<T> | null) => void;
}

/**
 * Sort chip showing current sort with popover to modify.
 * Appearance: [↑ Property Name ▾]
 */
export function SortChip<T>({
	sort,
	properties,
	onSortChange,
}: SortChipProps<T>) {
	const [open, setOpen] = React.useState(false);

	// Find the property for the current sort
	const property = properties.find((p) => p.id === sort.propertyId);
	const label = property?.label ?? String(sort.propertyId);

	const handlePropertyChange = (propertyId: string | null) => {
		if (!propertyId) return;
		onSortChange({
			...sort,
			propertyId: propertyId as PropertySort<T>["propertyId"],
		});
	};

	const handleDirectionToggle = () => {
		onSortChange({
			...sort,
			desc: !sort.desc,
		});
	};

	const handleRemove = () => {
		onSortChange(null);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger render={<Button variant="secondary" size="sm" />}>
				{sort.desc ? (
					<ArrowDownIcon className="size-3" />
				) : (
					<ArrowUpIcon className="size-3" />
				)}
				<span className="max-w-24 truncate">{label}</span>
				<ChevronDownIcon className="size-3 opacity-50" />
			</PopoverTrigger>
			<PopoverContent align="start">
				<div className="flex flex-col gap-3">
					{/* Property selector */}
					<div className="flex flex-col gap-1.5">
						<span className="text-muted-foreground text-xs">Sort by</span>
						<Select
							value={String(sort.propertyId)}
							onValueChange={handlePropertyChange}
						>
							<SelectTrigger size="sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{properties.map((prop) => (
									<SelectItem key={String(prop.id)} value={String(prop.id)}>
										{prop.label ?? String(prop.id)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Direction toggle */}
					<div className="flex flex-col gap-1.5">
						<span className="text-muted-foreground text-xs">Order</span>
						<div className="flex gap-1">
							<Button
								variant={!sort.desc ? "secondary" : "ghost"}
								size="sm"
								className="flex-1"
								onClick={() => !sort.desc || handleDirectionToggle()}
							>
								<ArrowUpIcon className="mr-1 size-3" />
								Ascending
							</Button>
							<Button
								variant={sort.desc ? "secondary" : "ghost"}
								size="sm"
								className="flex-1"
								onClick={() => sort.desc || handleDirectionToggle()}
							>
								<ArrowDownIcon className="mr-1 size-3" />
								Descending
							</Button>
						</div>
					</div>

					{/* Remove button */}
					<Button variant="destructive" size="sm" onClick={handleRemove}>
						<TrashIcon className="size-3.5" />
						Remove sort
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export type { SortChipProps };
