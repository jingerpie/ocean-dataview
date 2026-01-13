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
	/** Current operator value */
	value: FilterOperator;
	/** Callback when operator changes */
	onChange: (operator: FilterOperator) => void;
	/** Filter variant to determine available operators */
	variant: FilterVariant;
	/** Visual style variant */
	appearance?: "selector" | "inline";
	/** Additional class name */
	className?: string;
}

/**
 * Operator selector for filter conditions.
 * - `selector`: Default style with border (for filter builder)
 * - `inline`: Ghost/transparent style like inline text (for filter chip)
 */
export function OperatorPicker({
	value,
	onChange,
	variant,
	appearance = "selector",
	className,
}: OperatorPickerProps) {
	const operators = getFilterOperators(variant);
	const currentLabel =
		operators.find((op) => op.value === value)?.label ?? value;

	return (
		<Select
			value={value}
			onValueChange={(val) => {
				if (val) onChange(val as FilterOperator);
			}}
		>
			<SelectTrigger
				size="sm"
				className={cn(
					appearance === "inline" && "border-none bg-transparent! lowercase",
					className,
				)}
			>
				<SelectValue>{currentLabel}</SelectValue>
			</SelectTrigger>
			<SelectContent align="start">
				{operators.map((op) => (
					<SelectItem key={op.value} value={op.value}>
						{op.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

export type { OperatorPickerProps };
