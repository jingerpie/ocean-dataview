"use client";

import { Input } from "@ocean-dataview/dataview/components/ui/input";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { PropertyFilter } from "@ocean-dataview/shared/types";
import * as React from "react";

interface RangeFilterProps<T> {
	filter: PropertyFilter<T>;
	property: DataViewProperty<T>;
	inputId: string;
	onValueChange: (value: string[]) => void;
	min?: number;
	max?: number;
	className?: string;
}

/**
 * Dual min/max input for isBetween operator on number/range variants
 */
export function RangeFilter<T>({
	filter,
	property,
	inputId,
	onValueChange,
	min = 0,
	max = 100,
	className,
}: RangeFilterProps<T>) {
	const formatValue = React.useCallback(
		(value: string | number | undefined) => {
			if (value === undefined || value === "") return "";
			const numValue = Number(value);
			return Number.isNaN(numValue)
				? ""
				: numValue.toLocaleString(undefined, {
						maximumFractionDigits: 0,
					});
		},
		[],
	);

	const value = React.useMemo(() => {
		if (Array.isArray(filter.value)) return filter.value.map(formatValue);
		return [formatValue(filter.value), ""];
	}, [filter.value, formatValue]);

	const onRangeValueChange = React.useCallback(
		(inputValue: string, isMin?: boolean) => {
			const numValue = Number(inputValue);
			const currentValues = Array.isArray(filter.value)
				? filter.value
				: ["", ""];
			const otherValue = isMin
				? (currentValues[1] ?? "")
				: (currentValues[0] ?? "");

			if (
				inputValue === "" ||
				(!Number.isNaN(numValue) &&
					(isMin
						? numValue >= min && numValue <= (Number(otherValue) || max)
						: numValue <= max && numValue >= (Number(otherValue) || min)))
			) {
				onValueChange(
					isMin ? [inputValue, otherValue] : [otherValue, inputValue],
				);
			}
		},
		[filter.value, min, max, onValueChange],
	);

	return (
		<div
			data-slot="range"
			className={cn("flex w-full items-center gap-0", className)}
		>
			<Input
				id={`${inputId}-min`}
				type="number"
				aria-label={`${property.label ?? property.id} minimum value`}
				aria-valuemin={min}
				aria-valuemax={max}
				data-slot="range-min"
				inputMode="numeric"
				placeholder={min.toString()}
				min={min}
				max={max}
				className="h-full w-full rounded-none border-r-0 px-1.5"
				defaultValue={value[0]}
				onChange={(event) => onRangeValueChange(event.target.value, true)}
			/>
			<Input
				id={`${inputId}-max`}
				type="number"
				aria-label={`${property.label ?? property.id} maximum value`}
				aria-valuemin={min}
				aria-valuemax={max}
				data-slot="range-max"
				inputMode="numeric"
				placeholder={max.toString()}
				min={min}
				max={max}
				className="h-full w-full rounded-none px-1.5"
				defaultValue={value[1]}
				onChange={(event) => onRangeValueChange(event.target.value)}
			/>
		</div>
	);
}

export type { RangeFilterProps };
