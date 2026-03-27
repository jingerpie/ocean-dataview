"use client";

import {
  Area,
  CartesianGrid,
  AreaChart as RechartsAreaChart,
  XAxis,
  YAxis,
} from "recharts";
import { useInteractiveLegend } from "../../../hooks/use-interactive-legend";
import type { AxisNameType, GridLineType } from "../../../types/chart.type";
import type { ChartColorScheme } from "../../../utils/chart-colors";
import type { ChartDataPoint } from "../../../utils/compute-data";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../ui/chart";
import { ChartPaginatedLegend } from "../../ui/chart-paginated-legend";

interface AreaChartInnerProps {
  axisName?: AxisNameType;
  colorScheme: ChartColorScheme;
  colors: string[];
  data: ChartDataPoint[];
  gridLine?: GridLineType;
  groupKeys?: string[];
  height: number;
  showDots?: boolean;
  showLegend?: boolean;
  smoothLine?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  yAxisRange?: { min: number; max: number };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Chart rendering with conditional axes and legend handling
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
        className="w-full"
        config={chartConfig}
        style={{ height }}
      >
        <RechartsAreaChart data={data} margin={chartMargin}>
          <defs>
            {isStacked ? (
              groupKeys.map((key, index) => (
                <linearGradient
                  id={getGradientId(key, index)}
                  key={key}
                  x1="0"
                  x2="0"
                  y1="0"
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
              <linearGradient id="fillValue" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1} />
              </linearGradient>
            )}
          </defs>

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
                hideLabel={isStacked}
                hideZeroValues={true}
              />
            }
          />

          {isStacked ? (
            groupKeys.map((key, index) => {
              const isHidden = areaProps[key] === true;
              const fillOpacity = Number(
                areaProps.hover === key || !areaProps.hover ? 1 : 0.2
              );

              return (
                <Area
                  activeDot={showDots ? { r: 6 } : false}
                  dataKey={key}
                  dot={
                    showDots
                      ? { fill: colors[index % colors.length], r: 4 }
                      : false
                  }
                  fill={`url(#${getGradientId(key, index)})`}
                  fillOpacity={fillOpacity}
                  hide={isHidden}
                  isAnimationActive={false}
                  key={key}
                  stroke={colors[index % colors.length]}
                  strokeOpacity={fillOpacity}
                  strokeWidth={2}
                  type={areaType}
                />
              );
            })
          ) : (
            <Area
              activeDot={showDots ? { r: 6 } : false}
              dataKey="value"
              dot={showDots ? { fill: colors[0], r: 4 } : false}
              fill="url(#fillValue)"
              isAnimationActive={false}
              stroke={colors[0]}
              strokeWidth={2}
              type={areaType}
            />
          )}
        </RechartsAreaChart>
      </ChartContainer>

      {isStacked && showLegend && (
        <ChartPaginatedLegend
          colors={colors}
          groupKeys={groupKeys}
          legendState={legendState}
          onClick={selectArea}
          onMouseOut={handleLegendMouseLeave}
          onMouseOver={handleLegendMouseEnter}
        />
      )}
    </div>
  );
}
