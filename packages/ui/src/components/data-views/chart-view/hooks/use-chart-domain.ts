import type { ChartDataPoint } from "@ocean-dataview/ui/lib/data-views/utils/compute-data";
import { useMemo } from "react";

interface UseChartDomainOptions {
	data: ChartDataPoint[];
	groupKeys?: string[];
	isStacked?: boolean;
	customRange?: { min: number; max: number };
	axis?: "x" | "y";
}

/**
 * Custom hook for calculating fixed chart domain
 * Prevents axis from changing when hiding/showing chart series
 */
export function useChartDomain({
	data,
	groupKeys = [],
	isStacked = false,
	customRange,
	axis: _axis = "y",
}: UseChartDomainOptions): [number, number] {
	return useMemo(() => {
		// Use custom range if provided
		if (customRange) {
			return [customRange.min, customRange.max];
		}

		// For stacked data, calculate the maximum total across all data points
		if (isStacked && groupKeys.length > 0) {
			const maxTotal = Math.max(
				...data.map((item) => {
					return groupKeys.reduce((sum, key) => {
						const value = item[key as keyof typeof item];
						return sum + (typeof value === "number" ? value : 0);
					}, 0);
				}),
				0, // Ensure at least 0
			);
			// Ensure minimum domain of [0, 1] to prevent axis from disappearing
			return [0, Math.max(maxTotal, 1)];
		}

		// For single series, find the maximum value
		const maxValue = Math.max(
			...data.map((item) => {
				const value = item.value;
				return typeof value === "number" ? value : 0;
			}),
			0, // Ensure at least 0
		);
		// Ensure minimum domain of [0, 1] to prevent axis from disappearing
		return [0, Math.max(maxValue, 1)];
	}, [data, groupKeys, isStacked, customRange]);
}
