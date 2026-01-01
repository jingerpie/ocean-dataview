import { useState } from "react";
import type { LegendPayload } from "recharts/types/component/DefaultLegendContent";

/**
 * Custom hook for managing interactive legend state
 * Handles hiding/showing chart series and hover effects
 *
 * Uses the Recharts Legend pattern with event handlers
 * State structure matches the example pattern for optimal performance
 *
 * @param groupKeys - Array of data keys for the chart series
 */
export function useInteractiveLegend(groupKeys: string[]) {
	// State structure: { key1: false/true, key2: false/true, hover: null/"key" }
	const [legendProps, setLegendProps] = useState<
		Record<string, boolean | string | null>
	>(
		groupKeys.reduce(
			(acc, key) => {
				acc[key] = false;
				return acc;
			},
			{ hover: null } as Record<string, boolean | string | null>,
		),
	);

	// Handle mouse enter on legend item
	const handleLegendMouseEnter = (data: LegendPayload) => {
		const key = String(data.dataKey);
		if (data.dataKey && !legendProps[key]) {
			setLegendProps({ ...legendProps, hover: key });
		}
	};

	// Handle mouse leave on legend item
	const handleLegendMouseLeave = () => {
		setLegendProps({ ...legendProps, hover: null });
	};

	// Handle click to toggle visibility
	const selectItem = (data: LegendPayload) => {
		const key = String(data.dataKey);
		if (data.dataKey) {
			setLegendProps({
				...legendProps,
				[key]: !legendProps[key],
				hover: null,
			});
		}
	};

	// Compute legend state for ChartLegendContent
	const legendState = {
		hiddenItems: Object.fromEntries(
			groupKeys.map((key) => [key, legendProps[key] === true]),
		),
		hoveredItem: String(legendProps.hover || ""),
	};

	return {
		legendProps,
		legendState,
		handleLegendMouseEnter,
		handleLegendMouseLeave,
		selectItem,
	};
}
