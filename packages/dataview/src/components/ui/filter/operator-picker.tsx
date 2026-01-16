"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ocean-dataview/dataview/components/ui/select";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import type {
	FilterOperator,
	FilterVariant,
} from "@ocean-dataview/shared/types";
import { getFilterOperators } from "@ocean-dataview/shared/utils";

interface OperatorPickerProps {
	value: FilterOperator;
	onChange: (operator: FilterOperator) => void;
	variant: FilterVariant;
	/** Inline style (no border, transparent) for filter chips */
	inline?: boolean;
	className?: string;
}

export function OperatorPicker({
	value,
	onChange,
	variant,
	inline,
	className,
}: OperatorPickerProps) {
	const items = getFilterOperators(variant);

	return (
		<Select
			items={items}
			onValueChange={(val) => {
				if (val) {
					onChange(val as FilterOperator);
				}
			}}
			value={value}
		>
			<SelectTrigger
				className={cn(
					inline && "border-none bg-transparent! lowercase",
					className
				)}
				size="sm"
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent align="start">
				{items.map((item) => (
					<SelectItem key={item.value} value={item.value}>
						{item.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

export type { OperatorPickerProps };
