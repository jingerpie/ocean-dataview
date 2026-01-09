"use client";

import {
	Area,
	CartesianGrid,
	AreaChart as RechartsAreaChart,
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

interface AreaChartInnerProps {
	data: ChartDataPoint[];
	height: number;
	colors: string[];
	colorScheme: ChartColorScheme;
	gridLine?: GridLineType;
	axisName?: AxisNameType;
	xAxisLabel?: string;
	yAxisLabel?: string;
	yAxisRange?: { min: number; max: number };
	smoothLine?: boolean;
	showLegend?: boolean;
	showDots?: boolean;
	groupKeys?: string[];
}

export function AreaChartInner({
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
	showDots = false,
	groupKeys = [],
}: AreaChartInnerProps) {
	const isStacked = groupKeys.length > 0;

	const {
		legendProps: areaProps,
		legendState,
		handleLegendMouseEnter,
		handleLegendMouseLeave,
		selectItem: selectArea,
	} = useInteractiveLegend(groupKeys);

	const areaType = smoothLine ? "monotone" : "linear";

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
		: {
				value: {
					label: "Value",
					color: colors[0],
				},
			};

	const showGridX = gridLine === "vertical" || gridLine === "both";
	const showGridY = gridLine === "horizontal" || gridLine === "both";

	const getGradientId = (_key: string, index: number) => {
		return `fillArea${index}`;
	};

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
				<RechartsAreaChart data={data} margin={chartMargin}>
					<defs>
						{isStacked ? (
							groupKeys.map((key, index) => (
								<linearGradient
									key={key}
									id={getGradientId(key, index)}
									x1="0"
									y1="0"
									x2="0"
									y2="1"
								>
									<stop
										offset="5%"
										stopColor={colors[index % colors.length]}
										stopOpacity={0.8}
									/>
									<stop
										offset="95%"
										stopColor={colors[index % colors.length]}
										stopOpacity={0.1}
									/>
								</linearGradient>
							))
						) : (
							<linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor={colors[0]} stopOpacity={0.8} />
								<stop offset="95%" stopColor={colors[0]} stopOpacity={0.1} />
							</linearGradient>
						)}
					</defs>

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
								hideLabel={isStacked}
								hideZeroValues={true}
							/>
						}
					/>

					{isStacked ? (
						groupKeys.map((key, index) => {
							const isHidden = areaProps[key] === true;
							const fillOpacity = Number(
								areaProps.hover === key || !areaProps.hover ? 1 : 0.2,
							);

							return (
								<Area
									key={key}
									type={areaType}
									dataKey={key}
									stroke={colors[index % colors.length]}
									fill={`url(#${getGradientId(key, index)})`}
									strokeWidth={2}
									fillOpacity={fillOpacity}
									strokeOpacity={fillOpacity}
									hide={isHidden}
									dot={
										showDots
											? { fill: colors[index % colors.length], r: 4 }
											: false
									}
									activeDot={showDots ? { r: 6 } : false}
									isAnimationActive={false}
								/>
							);
						})
					) : (
						<Area
							type={areaType}
							dataKey="value"
							stroke={colors[0]}
							fill="url(#fillValue)"
							strokeWidth={2}
							dot={showDots ? { fill: colors[0], r: 4 } : false}
							activeDot={showDots ? { r: 6 } : false}
							isAnimationActive={false}
						/>
					)}
				</RechartsAreaChart>
			</ChartContainer>

			{isStacked && showLegend && (
				<ChartPaginatedLegend
					groupKeys={groupKeys}
					colors={colors}
					legendState={legendState}
					onClick={selectArea}
					onMouseOver={handleLegendMouseEnter}
					onMouseOut={handleLegendMouseLeave}
				/>
			)}
		</div>
	);
}
