"use client";

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  XAxis,
  YAxis,
} from "recharts";
import { useInteractiveLegend } from "../../../hooks";
import type { ChartDataPoint } from "../../../lib/utils/compute-data";
import type { AxisNameType, GridLineType } from "../../../types/chart.type";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../ui/chart";
import { ChartPaginatedLegend } from "../../ui/chart-paginated-legend";

interface LineChartInnerProps {
  data: ChartDataPoint[];
  height: number;
  colors: string[];
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

export function LineChartInner({
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
}: LineChartInnerProps) {
  const isMultiSeries = groupKeys.length > 0;

  const {
    legendProps: lineProps,
    legendState,
    handleLegendMouseEnter,
    handleLegendMouseLeave,
    selectItem: selectLine,
  } = useInteractiveLegend(groupKeys);

  const chartConfig = isMultiSeries
    ? (() => {
        const config: Record<string, { label: string; color: string }> = {};
        for (let index = 0; index < groupKeys.length; index++) {
          const key = groupKeys[index];
          if (!key) {
            continue;
          }
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

  const lineType = smoothLine ? "monotone" : "linear";

  const chartMargin = {
    top: 1,
    left: axisName === "yAxis" || axisName === "both" ? 8 : 0,
    bottom: showLegend ? 20 : 0,
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <ChartContainer
        className="w-full"
        config={chartConfig}
        style={{ height }}
      >
        <RechartsLineChart data={data} margin={chartMargin}>
          <CartesianGrid
            horizontal={showGridY}
            stroke="hsl(var(--border))"
            strokeDasharray="3 3"
            vertical={showGridX}
          />

          <XAxis
            axisLine={false}
            dataKey="name"
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
            tickLine={false}
            tickMargin={8}
            type="category"
          />

          <YAxis
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
            tickLine={false}
            type="number"
            width="auto"
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
            groupKeys.map((key, index) => {
              const isHidden = lineProps[key] === true;
              const strokeOpacity = Number(
                lineProps.hover === key || !lineProps.hover ? 1 : 0.2
              );
              const strokeWidth = lineProps.hover === key ? 3 : 2;

              return (
                <Line
                  activeDot={showDots ? { r: 6 } : false}
                  dataKey={key}
                  dot={
                    showDots
                      ? {
                          fill: colors[index % colors.length],
                          r: 4,
                          fillOpacity: strokeOpacity,
                        }
                      : false
                  }
                  hide={isHidden}
                  isAnimationActive={false}
                  key={key}
                  stroke={colors[index % colors.length]}
                  strokeOpacity={strokeOpacity}
                  strokeWidth={strokeWidth}
                  type={lineType}
                />
              );
            })
          ) : (
            <Line
              activeDot={showDots ? { r: 6 } : false}
              dataKey="value"
              dot={showDots ? { fill: colors[0], r: 4 } : false}
              isAnimationActive={false}
              stroke={colors[0]}
              strokeWidth={2}
              type={lineType}
            />
          )}
        </RechartsLineChart>
      </ChartContainer>

      {isMultiSeries && showLegend && (
        <ChartPaginatedLegend
          colors={colors}
          groupKeys={groupKeys}
          legendState={legendState}
          onClick={selectLine}
          onMouseOut={handleLegendMouseLeave}
          onMouseOver={handleLegendMouseEnter}
        />
      )}
    </div>
  );
}
