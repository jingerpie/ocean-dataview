"use client";

import { AlertCircle } from "lucide-react";
import { useChartTransform } from "../../../hooks";
import { useChartViewContext } from "../../../lib/providers/chart-view-context";
import {
	getChartColors,
	getChartHeight,
} from "../../../lib/utils/chart-colors";
import type { DataViewProperty } from "../../../types";
import type { VerticalBarChartConfig } from "../../../types/chart.type";
import { VerticalBarChartInner } from "./vertical-bar-chart";

export interface VerticalBarChartViewProps<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
> {
	config: VerticalBarChartConfig<TData, TProperties>;
}

export function VerticalBarChartView<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
>({ config }: VerticalBarChartViewProps<TData, TProperties>) {
	const { data, properties } = useChartViewContext<TData, TProperties>();

	const { chartData, groupKeys, xAxisLabel, yAxisLabel, validationError } =
		useChartTransform(data, properties, "verticalBar", config);

	const height = getChartHeight(config.style.height);
	const colors = getChartColors(
		config.style.color,
		groupKeys.length > 0 ? groupKeys.length : chartData.length,
	);

	// Error state
	if (validationError) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/5 p-8">
				<AlertCircle className="mb-4 h-12 w-12 text-destructive" />
				<p className="font-medium text-destructive">
					Invalid chart configuration
				</p>
				<p className="mt-2 text-muted-foreground text-sm">{validationError}</p>
			</div>
		);
	}

	// Empty state
	if (data.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border bg-muted/30 p-8">
				<p className="text-muted-foreground">No data to display</p>
			</div>
		);
	}

	// No data after aggregation
	if (chartData.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border bg-muted/30 p-8">
				<p className="text-muted-foreground">No data matches filters</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{config.style.caption && (
				<h3 className="font-semibold text-foreground text-lg">
					{config.style.caption}
				</h3>
			)}

			<div className="rounded-lg border bg-card p-4">
				<VerticalBarChartInner
					data={chartData}
					height={height}
					colors={colors}
					colorScheme={config.style.color}
					gridLine={config.style.gridLine}
					axisName={config.style.axisName}
					dataLabels={config.style.dataLabels}
					xAxisLabel={xAxisLabel}
					yAxisLabel={yAxisLabel}
					yAxisRange={config.yAxis?.range}
					groupKeys={groupKeys}
					showLegend={config.style.showLegend}
				/>
			</div>
		</div>
	);
}

export { VerticalBarChartInner } from "./vertical-bar-chart";
