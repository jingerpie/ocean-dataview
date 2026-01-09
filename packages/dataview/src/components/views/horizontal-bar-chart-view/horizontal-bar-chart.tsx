"use client";

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
import type { ChartColorScheme } from "../../../lib/utils/chart-colors";
import type { ChartDataPoint } from "../../../lib/utils/compute-data";
import type { AxisNameType, GridLineType } from "../../../types/chart.type";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "../../ui/chart";
import { ChartPaginatedLegend } from "../../ui/chart-paginated-legend";

interface HorizontalBarChartInnerProps {
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
	groupKeys?: string[];
	showLegend?: boolean;
}

export function HorizontalBarChartInner({
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
}: HorizontalBarChartInnerProps) {
	const isStacked = groupKeys.length > 0;
	const chartData = data;

	const {
		legendProps: barProps,
		legendState,
		handleLegendMouseEnter,
		handleLegendMouseLeave,
		selectItem: selectBar,
	} = useInteractiveLegend(groupKeys);

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

	const chartMargin = {
		right: dataLabels ? 20 : 0,
		left: axisName === "yAxis" || axisName === "both" ? 8 : 0,
		bottom: showLegend ? 20 : 0,
	};

	const chartDataWithTotalLabels = useMemo(() => {
		return chartData.map((item) => {
			const totalLabel = groupKeys.reduce((sum, key) => {
				if (barProps[key] === true) return sum;
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
						(() => {
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
						<Bar
							dataKey="value"
							fill={colors[0]}
							radius={[0, 4, 4, 0]}
							isAnimationActive={false}
						/>
					)}

					{dataLabels && (
						<Bar
							dataKey="__PLACEHOLDER_BAR__"
							fill="transparent"
							stroke="none"
							isAnimationActive={false}
							stackId={isStacked ? "a" : undefined}
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
