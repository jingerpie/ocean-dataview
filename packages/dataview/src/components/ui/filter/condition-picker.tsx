"use client";

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ocean-dataview/dataview/components/ui/select";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import type {
	FilterCondition,
	FilterVariant,
} from "@ocean-dataview/shared/types";
import { getFilterConditions } from "@ocean-dataview/shared/utils";

interface ConditionPickerProps {
	condition: FilterCondition;
	onConditionChange: (condition: FilterCondition) => void;
	variant: FilterVariant;
	/** Inline style (no border, transparent) for filter chips */
	inline?: boolean;
	className?: string;
}

export function ConditionPicker({
	condition,
	onConditionChange,
	variant,
	inline,
	className,
}: ConditionPickerProps) {
	const items = getFilterConditions(variant);

	return (
		<Select
			items={items}
			onValueChange={(val) => {
				if (val) {
					onConditionChange(val as FilterCondition);
				}
			}}
			value={condition}
		>
			<SelectTrigger
				className={cn(
					inline && "border-none bg-transparent! pl-2 lowercase",
					className
				)}
				size="sm"
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent align="start">
				<SelectGroup>
					{items.map((item) => (
						<SelectItem key={item.value} value={item.value}>
							{item.label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

export type { ConditionPickerProps };
