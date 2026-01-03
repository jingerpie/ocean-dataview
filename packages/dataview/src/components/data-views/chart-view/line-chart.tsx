"use client";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ocean-dataview/dataview/components/ui/chart";
import { useInteractiveLegend } from "@ocean-dataview/dataview/lib/data-views/hooks";
import type {
	AxisNameType,
	GridLineType,
} from "@ocean-dataview/dataview/lib/data-views/types/chart-types";
import type { ChartDataPoint } from "@ocean-dataview/dataview/lib/data-views/utils/compute-data";
import {
	CartesianGrid,
	Line,
	LineChart as RechartsLineChart,
	XAxis,
	YAxis,
} from "recharts";
import { ChartPaginatedLegend } from "./chart-paginated-legend";

interface LineChartProps {
	data: ChartDataPoint[];
	height: number;
	colors: string[];
	gridLine?: GridLineType;
	axisName?: AxisNameType;
	dataLabels?: boolean;
	xAxisLabel?: string;
	yAxisLabel?: string;
	yAxisRange?: { min: number; max: number };
	smoothLine?: boolean;
	showLegend?: boolean;
	showDots?: boolean;
	groupKeys?: string[]; // For multi-series line charts
}

export function LineChart({
	data,
	height,
	colors,
	gridLine = "horizontal",
	axisName = "none",
	xAxisLabel,
	yAxisLabel,
	yAxisRange,
	smoothLine = false,
	showLegend = false,
	showDots = true,
	groupKeys = [],
}: LineChartProps) {
	// Check if we have multi-series data
	const isMultiSeries = groupKeys.length > 0;

	// Interactive legend state
	const {
		legendProps: lineProps,
		legendState,
		handleLegendMouseEnter,
		handleLegendMouseLeave,
		selectItem: selectLine,
	} = useInteractiveLegend(groupKeys);

	// Create chart config for shadcn/ui chart
	const chartConfig = isMultiSeries
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
		: {
				value: {
					label: "Value",
					color: colors[0],
				},
			};

	const showGridX = gridLine === "vertical" || gridLine === "both";
	const showGridY = gridLine === "horizontal" || gridLine === "both";

	// Line type based on smoothLine setting
	const lineType = smoothLine ? "monotone" : "linear";

	// Calculate dynamic margins - let Recharts auto-calculate YAxis width
	const chartMargin = {
		top: 1,
		left: axisName === "yAxis" || axisName === "both" ? 8 : 0,
		bottom: showLegend ? 20 : 0,
	};

	return (
		<div className="flex w-full flex-col gap-2">
			<ChartContainer
				config={chartConfig}
				className="w-full"
				style={{ height }}
			>
				<RechartsLineChart data={data} margin={chartMargin}>
					<CartesianGrid
						strokeDasharray="3 3"
						vertical={showGridX}
						horizontal={showGridY}
						stroke="hsl(var(--border))"
					/>

					<XAxis
						dataKey="name"
						type="category"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
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
						type="number"
						width="auto"
						tickLine={false}
						axisLine={false}
						domain={yAxisRange ? [yAxisRange.min, yAxisRange.max] : undefined}
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
								hideLabel={isMultiSeries}
								hideZeroValues={true}
							/>
						}
					/>

					{isMultiSeries ? (
						// Render multi-series lines with interactive hover
						groupKeys.map((key, index) => {
							const isHidden = lineProps[key] === true;
							const strokeOpacity = Number(
								lineProps.hover === key || !lineProps.hover ? 1 : 0.2,
							);
							const strokeWidth = lineProps.hover === key ? 3 : 2; // Thicker when hovered

							return (
								<Line
									key={key}
									type={lineType}
									dataKey={key}
									stroke={colors[index % colors.length]}
									strokeWidth={strokeWidth}
									strokeOpacity={strokeOpacity}
									hide={isHidden}
									dot={
										showDots
											? {
													fill: colors[index % colors.length],
													r: 4,
													fillOpacity: strokeOpacity,
												}
											: false
									}
									activeDot={showDots ? { r: 6 } : false}
									isAnimationActive={false}
								/>
							);
						})
					) : (
						// Render single line
						<Line
							type={lineType}
							dataKey="value"
							stroke={colors[0]}
							strokeWidth={2}
							dot={showDots ? { fill: colors[0], r: 4 } : false}
							activeDot={showDots ? { r: 6 } : false}
							isAnimationActive={false}
						/>
					)}
				</RechartsLineChart>
			</ChartContainer>

			{isMultiSeries && showLegend && (
				<ChartPaginatedLegend
					groupKeys={groupKeys}
					colors={colors}
					legendState={legendState}
					onClick={selectLine}
					onMouseOver={handleLegendMouseEnter}
					onMouseOut={handleLegendMouseLeave}
				/>
			)}
		</div>
	);
}
