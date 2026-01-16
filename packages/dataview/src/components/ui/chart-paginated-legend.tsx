"use client";

import { useMemo } from "react";
import type { LegendPayload } from "recharts/types/component/DefaultLegendContent";
import { PaginatedLegend } from "./paginated-legend";

interface ChartPaginatedLegendProps {
	groupKeys: string[];
	colors: string[];
	legendState?: {
		hiddenItems: Record<string, boolean>;
		hoveredItem: string | null;
	};
	onClick?: (data: LegendPayload, index: number, e: React.MouseEvent) => void;
	onMouseOver?: (
		data: LegendPayload,
		index: number,
		e: React.MouseEvent
	) => void;
	onMouseOut?: (
		data: LegendPayload,
		index: number,
		e: React.MouseEvent
	) => void;
}

export function ChartPaginatedLegend({
	groupKeys,
	colors,
	legendState,
	onClick,
	onMouseOver,
	onMouseOut,
}: ChartPaginatedLegendProps) {
	// Memoize items array to prevent recreation on every render
	const items = useMemo(
		() =>
			groupKeys.map((key, index) => {
				const color = colors[index % colors.length];
				return {
					name: key,
					color: color ?? "#000000", // Fallback to black if colors array is empty
				};
			}),
		[groupKeys, colors]
	);

	return (
		<PaginatedLegend
			items={items}
			legendState={legendState}
			onClick={onClick}
			onMouseOut={onMouseOut}
			onMouseOver={onMouseOver}
		/>
	);
}
