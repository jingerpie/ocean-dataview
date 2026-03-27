"use client";

import { AlertCircle } from "lucide-react";
import { useChartTransform } from "../../../hooks/use-chart-transform";
import { useChartViewContext } from "../../../lib/providers/chart-view-context";
import type { VerticalBarChartConfig } from "../../../types/chart.type";
import type { DataViewProperty } from "../../../types/property.type";
import { getChartColors, getChartHeight } from "../../../utils/chart-colors";
import { EmptyState } from "../empty-state";
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
    groupKeys.length > 0 ? groupKeys.length : chartData.length
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

  if (data.length === 0 || chartData.length === 0) {
    return <EmptyState />;
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
          axisName={config.style.axisName}
          colorScheme={config.style.color}
          colors={colors}
          data={chartData}
          dataLabels={config.style.dataLabels}
          gridLine={config.style.gridLine}
          groupKeys={groupKeys}
          height={height}
          showLegend={config.style.showLegend}
          xAxisLabel={xAxisLabel}
          yAxisLabel={yAxisLabel}
          yAxisRange={config.yAxis?.range}
        />
      </div>
    </div>
  );
}

// biome-ignore lint/performance/noBarrelFile: Re-exporting chart inner component
export { VerticalBarChartInner } from "./vertical-bar-chart";
