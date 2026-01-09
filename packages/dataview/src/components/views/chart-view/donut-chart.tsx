"use client";

import { useMemo } from "react";
import {
	Cell,
	Label,
	Pie,
	type PieLabelRenderProps,
	PieChart as RechartsPieChart,
} from "recharts";
import { useInteractiveLegend } from "../../../hooks";
import type { ChartDataPoint } from "../../../lib/utils/compute-data";
import type { DataLabelFormatType } from "../../../types/chart.type";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "../../ui/chart";
import { ChartPaginatedLegend } from "./chart-paginated-legend";

interface DonutChartProps {
	data: ChartDataPoint[];
	height: number;
	colors: string[];
	showValueInCenter?: boolean;
	showLegend?: boolean;
	dataLabelFormat?: DataLabelFormatType;
}

export function DonutChart({
	data,
	height,
	colors,
	showValueInCenter = false,
	showLegend = true,
	dataLabelFormat = "none",
}: DonutChartProps) {
	// Get group keys (names) for interactive legend
	const groupKeys = data.map((item) => item.name);

	// Interactive legend state
	const {
		legendProps: pieProps,
		legendState,
		handleLegendMouseEnter,
		handleLegendMouseLeave,
		selectItem: selectPie,
	} = useInteractiveLegend(groupKeys);

	// Filter out hidden slices and recalculate data
	const visibleData = useMemo(() => {
		return data.filter((item) => pieProps[item.name] !== true);
	}, [data, pieProps]);

	// Create chart config for shadcn/ui chart
	const chartConfig = (() => {
		const config: Record<string, { label: string; color: string }> = {};
		for (let index = 0; index < data.length; index++) {
			const item = data[index];
			if (!item) continue;
			const color = colors[index % colors.length];
			config[item.name] = {
				label: item.name,
				color: color ?? "#000000",
			};
		}
		return config;
	})();

	// Calculate total for center display (using visible data)
	const total = visibleData.reduce((sum, item) => sum + (item.value || 0), 0);

	// Format label based on dataLabelFormat
	const renderLabel = (props: PieLabelRenderProps) => {
		if (dataLabelFormat === "none") return null;

		const entry = data[props.index];
		if (!entry) return null;

		const percentage = entry.percentage?.toFixed(1) || "0.0";

		switch (dataLabelFormat) {
			case "value":
				return `${percentage}%`;
			case "name":
				return entry.name;
			case "nameAndValue":
				return `${entry.name} (${percentage}%)`;
			default:
				return null;
		}
	};

	return (
		<div className="flex w-full flex-col gap-2">
			<ChartContainer
				config={chartConfig}
				className="w-full"
				style={{ height }}
			>
				<RechartsPieChart>
					<ChartTooltip
						content={
							<ChartTooltipContent
								hideLabel
								hideZeroValues={true}
								formatter={(value, name) => {
									const dataPoint = data.find((d) => d.name === name);
									const percentage = dataPoint?.percentage?.toFixed(1) || "0.0";
									return (
										<div className="flex items-center gap-2">
											<span>{name}:</span>
											<span className="font-bold">
												{value?.toLocaleString()}
											</span>
											<span className="text-muted-foreground">
												({percentage}%)
											</span>
										</div>
									);
								}}
							/>
						}
					/>

					<Pie
						data={visibleData}
						dataKey="value"
						nameKey="name"
						innerRadius={90}
						outerRadius={110}
						paddingAngle={1}
						label={dataLabelFormat !== "none" ? renderLabel : false}
						labelLine={dataLabelFormat !== "none"}
						isAnimationActive={false}
					>
						{visibleData.map((entry) => {
							const originalIndex = data.findIndex(
								(d) => d.name === entry.name,
							);
							const fillOpacity = Number(
								pieProps.hover === entry.name || !pieProps.hover ? 1 : 0.5,
							);

							return (
								<Cell
									key={`cell-${entry.name}`}
									fill={colors[originalIndex % colors.length]}
									fillOpacity={fillOpacity}
								/>
							);
						})}

						{showValueInCenter && (
							<Label
								content={({ viewBox }) => {
									if (viewBox && "cx" in viewBox && "cy" in viewBox) {
										return (
											<text
												x={viewBox.cx}
												y={viewBox.cy}
												textAnchor="middle"
												dominantBaseline="middle"
											>
												<tspan
													x={viewBox.cx}
													y={viewBox.cy}
													className="fill-foreground font-bold text-3xl"
												>
													{total.toLocaleString()}
												</tspan>
												<tspan
													x={viewBox.cx}
													y={(viewBox.cy || 0) + 24}
													className="fill-muted-foreground"
												>
													Total
												</tspan>
											</text>
										);
									}
								}}
							/>
						)}
					</Pie>
				</RechartsPieChart>
			</ChartContainer>

			{showLegend && (
				<ChartPaginatedLegend
					groupKeys={groupKeys}
					colors={colors}
					legendState={legendState}
					onClick={selectPie}
					onMouseOver={handleLegendMouseEnter}
					onMouseOut={handleLegendMouseLeave}
				/>
			)}
		</div>
	);
}
