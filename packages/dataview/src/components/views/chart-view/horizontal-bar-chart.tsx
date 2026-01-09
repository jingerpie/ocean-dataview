"use client";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ocean-dataview/dataview/components/ui/chart";
import type { ChartColorScheme } from "@ocean-dataview/dataview/lib/utils/chart-colors";
import type { ChartDataPoint } from "@ocean-dataview/dataview/lib/utils/compute-data";
import type {
	AxisNameType,
	GridLineType,
} from "@ocean-dataview/dataview/types/chart.type";
import { useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	LabelList,
	XAxis,
	YAxis,
} from "recharts";
import { useInteractiveLegend } from "../../../hooks";
import { ChartPaginatedLegend } from "./chart-paginated-legend";

interface HorizontalBarChartProps {
	data: ChartDataPoint[];
	height: number;
	colors: string[];
	colorScheme: ChartColorScheme;
	gridLine?: GridLineType;
	axisName?: AxisNameType;
	dataLabels?: boolean;
	xAxisLabel?: string;
	yAxisLabel?: string;
	xAxisRange?: { min: number; max: number };
	groupKeys?: string[]; // For stacked/grouped bars
	showLegend?: boolean;
}

export function HorizontalBarChart({
	data,
	height,
	colors,
	gridLine = "vertical",
	axisName = "none",
	dataLabels = false,
	xAxisLabel,
	yAxisLabel,
	xAxisRange,
	groupKeys = [],
	showLegend = true,
}: HorizontalBarChartProps) {
	// Check if we have stacked data
	const isStacked = groupKeys.length > 0;

	// Use data as-is - _total is already pre-computed in chart-view.tsx
	const chartData = data;

	// Interactive legend state
	const {
		legendProps: barProps,
		legendState,
		handleLegendMouseEnter,
		handleLegendMouseLeave,
		selectItem: selectBar,
	} = useInteractiveLegend(groupKeys);

	// Create chart config for shadcn/ui chart
	const chartConfig = isStacked
		? (() => {
				const config: Record<string, { label: string; color: string }> = {};
				for (let index = 0; index < groupKeys.length; index++) {
					const key = groupKeys[index];
					if (!key) continue;
					const color = colors[index % colors.length];
					config[key] = {
						label: key,
						color: color ?? "#000000",
					};
				}
				return config;
			})()
		: (() => {
				const config: Record<string, { label: string; color?: string }> = {
					value: { label: "Value" },
				};
				for (let index = 0; index < data.length; index++) {
					const item = data[index];
					if (!item) continue;
					config[item.name] = {
						label: item.name,
						color: colors[index % colors.length],
					};
				}
				return config;
			})();

	const showGridX = gridLine === "vertical" || gridLine === "both";
	const showGridY = gridLine === "horizontal" || gridLine === "both";

	// Calculate dynamic margins - let Recharts auto-calculate YAxis width for categories
	const chartMargin = {
		right: dataLabels ? 20 : 0,
		left: axisName === "yAxis" || axisName === "both" ? 8 : 0,
		bottom: showLegend ? 20 : 0,
	};

	// Compute visible totals for each data point (memoized to prevent recalculation)
	const chartDataWithTotalLabels = useMemo(() => {
		return chartData.map((item) => {
			const totalLabel = groupKeys.reduce((sum, key) => {
				if (barProps[key] === true) return sum; // Skip hidden bars
				const value = item[key as keyof typeof item];
				return sum + (typeof value === "number" ? value : 0);
			}, 0);

			return {
				...item,
				__BAR_TOTAL_LABEL__: totalLabel,
			};
		});
	}, [chartData, groupKeys, barProps]);

	return (
		<div className="flex w-full flex-col gap-2">
			<ChartContainer
				config={chartConfig}
				className="w-full"
				style={{ height }}
			>
				<BarChart
					data={chartDataWithTotalLabels}
					layout="vertical"
					margin={chartMargin}
				>
					<CartesianGrid
						strokeDasharray="3 3"
						vertical={showGridX}
						horizontal={showGridY}
						stroke="hsl(var(--border))"
					/>

					<XAxis
						type="number"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						domain={xAxisRange ? [xAxisRange.min, xAxisRange.max] : undefined}
						label={
							axisName === "xAxis" || axisName === "both"
								? {
										value: xAxisLabel || "Missing X Axis Label",
										position: "insideBottom",
										offset: -16,
										style: { textAnchor: "middle" },
									}
								: undefined
						}
					/>

					<YAxis
						dataKey="name"
						type="category"
						width="auto"
						tickLine={false}
						axisLine={false}
						label={
							axisName === "yAxis" || axisName === "both"
								? {
										value: yAxisLabel || "Missing Y Axis Label",
										angle: -90,
										position: "insideLeft",
										offset: 0,
										style: { textAnchor: "middle" },
									}
								: undefined
						}
					/>

					<ChartTooltip
						content={
							<ChartTooltipContent
								hideLabel={isStacked}
								hideZeroValues={true}
							/>
						}
					/>

					{isStacked ? (
						// Render stacked bars
						(() => {
							// Find the last visible bar index
							const visibleKeys = groupKeys.filter(
								(key) => barProps[key] !== true,
							);
							const lastVisibleKey = visibleKeys[visibleKeys.length - 1];

							return groupKeys.map((key, groupIndex) => {
								const isHidden = barProps[key] === true;
								const fillOpacity = Number(
									barProps.hover === key || !barProps.hover ? 1 : 0.2,
								);
								const isLastVisible = key === lastVisibleKey;

								return (
									<Bar
										key={key}
										dataKey={key}
										stackId="a"
										fill={colors[groupIndex % colors.length]}
										fillOpacity={fillOpacity}
										hide={isHidden}
										radius={isLastVisible ? [0, 4, 4, 0] : [0, 0, 0, 0]}
										isAnimationActive={false}
									/>
								);
							});
						})()
					) : (
						// Render single bar
						<Bar
							dataKey="value"
							fill={colors[0]}
							radius={[0, 4, 4, 0]}
							isAnimationActive={false}
						/>
					)}

					{/* Render labels - use a zero-width bar with labels */}
					{dataLabels && (
						<Bar
							dataKey="__PLACEHOLDER_BAR__" // Zero width bar for labels only
							fill="transparent"
							stroke="none"
							isAnimationActive={false}
							stackId={isStacked ? "a" : undefined} // Stack on end for stacked charts
							radius={[0, 0, 0, 0]}
						>
							<LabelList
								dataKey={
									isStacked
										? barProps.hover
											? String(barProps.hover)
											: "__BAR_TOTAL_LABEL__"
										: "value"
								}
								position="right"
								fontSize={12}
								offset={8}
								className="fill-foreground"
							/>
						</Bar>
					)}
				</BarChart>
			</ChartContainer>

			{isStacked && showLegend && (
				<ChartPaginatedLegend
					groupKeys={groupKeys}
					colors={colors}
					legendState={legendState}
					onClick={selectBar}
					onMouseOver={handleLegendMouseEnter}
					onMouseOut={handleLegendMouseLeave}
				/>
			)}
		</div>
	);
}
