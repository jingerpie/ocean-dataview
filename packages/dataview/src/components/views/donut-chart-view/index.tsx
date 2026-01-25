"use client";

import { AlertCircle } from "lucide-react";
import { useChartTransform } from "../../../hooks";
import { useChartViewContext } from "../../../lib/providers/chart-view-context";
import {
  getChartColors,
  getChartHeight,
} from "../../../lib/utils/chart-colors";
import type { DataViewProperty } from "../../../types";
import type { DonutChartConfig } from "../../../types/chart.type";
import { DonutChartInner } from "./donut-chart";

export interface DonutChartViewProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  config: DonutChartConfig<TData, TProperties>;
}

export function DonutChartView<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({ config }: DonutChartViewProps<TData, TProperties>) {
  const { data, properties } = useChartViewContext<TData, TProperties>();

  const { chartData, validationError } = useChartTransform(
    data,
    properties,
    "donut",
    config
  );

  const height = getChartHeight(config.style.height);
  const colors = getChartColors(config.style.color, chartData.length);

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

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/30 p-8">
        <p className="text-muted-foreground">No data to display</p>
      </div>
    );
  }

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
        <DonutChartInner
          colors={colors}
          data={chartData}
          dataLabelFormat={config.style.dataLabelFormat}
          height={height}
          showLegend={config.style.showLegend}
          showValueInCenter={config.style.showValueInCenter}
        />
      </div>
    </div>
  );
}

// biome-ignore lint/performance/noBarrelFile: Re-exporting chart inner component
export { DonutChartInner } from "./donut-chart";
