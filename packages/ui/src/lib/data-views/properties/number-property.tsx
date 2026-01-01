"use client";

import { cn } from "@ocean-dataview/ui/lib/utils";
import { useMemo } from "react";
import { EmptyValue } from "../components/empty-value";
import type { NumberPropertyType } from "../types/property-types";
import { getUserLocale } from "../utils/locale-helpers";

interface NumberPropertyProps<T> {
	value: unknown;
	property: NumberPropertyType<T>;
}

/**
 * Displays numeric values with configurable formatting
 * Supports number formats, currency symbols, and visual representations (bar/ring)
 * @param value - The numeric value to display
 * @param property - Property configuration with format settings
 * @returns Formatted number, currency, or visual progress indicator
 */
export function NumberProperty<T>({ value, property }: NumberPropertyProps<T>) {
	// Parse numeric value - must be called unconditionally
	const numValue = typeof value === "number" ? value : Number(value);
	const config = property.config;
	const decimalPlaces = config?.decimalPlaces ?? 0;
	const numberFormat = config?.numberFormat ?? "number";
	const showAs = config?.showAs ?? "number";

	// Get user locale once to avoid repeated lookups - must be called unconditionally
	const userLocale = getUserLocale();

	// Memoize formatted value - must be called unconditionally
	const formattedValue = useMemo(() => {
		switch (numberFormat) {
			case "numberWithCommas":
				return numValue.toLocaleString(userLocale, {
					minimumFractionDigits: decimalPlaces,
					maximumFractionDigits: decimalPlaces,
				});
			case "percentage":
				return `${numValue.toFixed(decimalPlaces)}%`;
			case "dollar":
				return `$${numValue.toLocaleString(userLocale, {
					minimumFractionDigits: decimalPlaces,
					maximumFractionDigits: decimalPlaces,
				})}`;
			case "euro":
				return `€${numValue.toLocaleString(userLocale, {
					minimumFractionDigits: decimalPlaces,
					maximumFractionDigits: decimalPlaces,
				})}`;
			case "pound":
				return `£${numValue.toLocaleString(userLocale, {
					minimumFractionDigits: decimalPlaces,
					maximumFractionDigits: decimalPlaces,
				})}`;
			default:
				return numValue.toFixed(decimalPlaces);
		}
	}, [numValue, numberFormat, decimalPlaces, userLocale]);

	// Early return after all hooks
	if (
		value == null ||
		(typeof value !== "number" && Number.isNaN(Number(value)))
	) {
		return <EmptyValue />;
	}

	// If showAs is a bar or ring
	if (typeof showAs === "object") {
		const percentage = (numValue / showAs.divideBy) * 100;
		const clampedPercentage = Math.min(100, Math.max(0, percentage));

		if (showAs.type === "bar") {
			return (
				<div className="flex w-full items-center gap-2">
					<div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full transition-all"
							style={{
								width: `${clampedPercentage}%`,
								backgroundColor: showAs.color,
							}}
						/>
					</div>
					{showAs.showNumber && (
						<span className="whitespace-nowrap font-medium text-sm">
							{formattedValue}
						</span>
					)}
				</div>
			);
		}

		if (showAs.type === "ring") {
			const radius = 16;
			const circumference = 2 * Math.PI * radius;
			const strokeDashoffset =
				circumference - (clampedPercentage / 100) * circumference;

			return (
				<div className="flex items-center gap-2">
					<svg
						width="36"
						height="36"
						className="-rotate-90 transform"
						role="img"
						aria-label={`Progress: ${clampedPercentage}%`}
					>
						<title>{`Progress: ${clampedPercentage}%`}</title>
						<circle
							cx="18"
							cy="18"
							r={radius}
							fill="none"
							stroke="currentColor"
							strokeWidth="3"
							className="text-muted"
						/>
						<circle
							cx="18"
							cy="18"
							r={radius}
							fill="none"
							stroke={showAs.color}
							strokeWidth="3"
							strokeDasharray={circumference}
							strokeDashoffset={strokeDashoffset}
							strokeLinecap="round"
						/>
					</svg>
					{showAs.showNumber && (
						<span className="font-medium text-sm">{formattedValue}</span>
					)}
				</div>
			);
		}
	}

	// Default number display
	return (
		<span className={cn("text-right font-medium text-sm tabular-nums")}>
			{formattedValue}
		</span>
	);
}
