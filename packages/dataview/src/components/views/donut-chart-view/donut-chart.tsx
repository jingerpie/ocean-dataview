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
import { ChartPaginatedLegend } from "../../ui/chart-paginated-legend";

interface DonutChartInnerProps {
	data: ChartDataPoint[];
	height: number;
	colors: string[];
	showValueInCenter?: boolean;
	showLegend?: boolean;
	dataLabelFormat?: DataLabelFormatType;
}

export function DonutChartInner({
	data,
	height,
	colors,
	showValueInCenter = false,
	showLegend = true,
	dataLabelFormat = "none",
}: DonutChartInnerProps) {
	const groupKeys = data.map((item) => item.name);

	const {
		legendProps: pieProps,
		legendState,
		handleLegendMouseEnter,
		handleLegendMouseLeave,
		selectItem: selectPie,
	} = useInteractiveLegend(groupKeys);

	const visibleData = useMemo(() => {
		return data.filter((item) => pieProps[item.name] !== true);
	}, [data, pieProps]);

	const chartConfig = (() => {
		const config: Record<string, { label: string; color: string }> = {};
		for (let index = 0; index < data.length; index++) {
			const item = data[index];
			if (!item) {
				continue;
			}
			const color = colors[index % colors.length];
			config[item.name] = {
				label: item.name,
				color: color ?? "#000000",
			};
		}
		return config;
	})();

	const total = visibleData.reduce((sum, item) => sum + (item.value || 0), 0);

	const renderLabel = (props: PieLabelRenderProps) => {
		if (dataLabelFormat === "none") {
			return null;
		}

		const entry = data[props.index];
		if (!entry) {
			return null;
		}

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
				className="w-full"
				config={chartConfig}
				style={{ height }}
			>
				<RechartsPieChart>
					<ChartTooltip
						content={
							<ChartTooltipContent
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
								hideLabel
								hideZeroValues={true}
							/>
						}
					/>

					<Pie
						data={visibleData}
						dataKey="value"
						innerRadius={90}
						isAnimationActive={false}
						label={dataLabelFormat !== "none" ? renderLabel : false}
						labelLine={dataLabelFormat !== "none"}
						nameKey="name"
						outerRadius={110}
						paddingAngle={1}
					>
						{visibleData.map((entry) => {
							const originalIndex = data.findIndex(
								(d) => d.name === entry.name
							);
							const fillOpacity = Number(
								pieProps.hover === entry.name || !pieProps.hover ? 1 : 0.5
							);

							return (
								<Cell
									fill={colors[originalIndex % colors.length]}
									fillOpacity={fillOpacity}
									key={`cell-${entry.name}`}
								/>
							);
						})}

						{showValueInCenter && (
							<Label
								content={({ viewBox }) => {
									if (viewBox && "cx" in viewBox && "cy" in viewBox) {
										return (
											<text
												dominantBaseline="middle"
												textAnchor="middle"
												x={viewBox.cx}
												y={viewBox.cy}
											>
												<tspan
													className="fill-foreground font-bold text-3xl"
													x={viewBox.cx}
													y={viewBox.cy}
												>
													{total.toLocaleString()}
												</tspan>
												<tspan
													className="fill-muted-foreground"
													x={viewBox.cx}
													y={(viewBox.cy || 0) + 24}
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
					colors={colors}
					groupKeys={groupKeys}
					legendState={legendState}
					onClick={selectPie}
					onMouseOut={handleLegendMouseLeave}
					onMouseOver={handleLegendMouseEnter}
				/>
			)}
		</div>
	);
}
