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
import { useState } from "react";

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
	const [open, setOpen] = useState(false);

	// Find the property for the current sort
	const property = properties.find((p) => p.id === sort.propertyId);
	const label = property?.label ?? String(sort.propertyId);

	const handlePropertyChange = (propertyId: string | null) => {
		if (!propertyId) {
			return;
		}
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
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger render={<Button size="sm" variant="secondary" />}>
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
							onValueChange={handlePropertyChange}
							value={String(sort.propertyId)}
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
								className="flex-1"
								onClick={() => !sort.desc || handleDirectionToggle()}
								size="sm"
								variant={sort.desc ? "ghost" : "secondary"}
							>
								<ArrowUpIcon className="mr-1 size-3" />
								Ascending
							</Button>
							<Button
								className="flex-1"
								onClick={() => sort.desc || handleDirectionToggle()}
								size="sm"
								variant={sort.desc ? "secondary" : "ghost"}
							>
								<ArrowDownIcon className="mr-1 size-3" />
								Descending
							</Button>
						</div>
					</div>

					{/* Remove button */}
					<Button onClick={handleRemove} size="sm" variant="destructive">
						<TrashIcon className="size-3.5" />
						Remove sort
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export type { SortChipProps };
