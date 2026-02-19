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

interface VerticalBarChartInnerProps {
  axisName?: AxisNameType;
  colorScheme: ChartColorScheme;
  colors: string[];
  data: ChartDataPoint[];
  dataLabels?: boolean;
  gridLine?: GridLineType;
  groupKeys?: string[];
  height: number;
  showLegend?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  yAxisRange?: { min: number; max: number };
}

export function VerticalBarChartInner({
  data,
  height,
  colors,
  gridLine = "horizontal",
  axisName = "none",
  dataLabels = false,
  xAxisLabel,
  yAxisLabel,
  yAxisRange,
  groupKeys = [],
  showLegend = true,
}: VerticalBarChartInnerProps) {
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
    : (() => {
        const config: Record<string, { label: string; color?: string }> = {
          value: { label: "Value" },
        };
        for (let index = 0; index < data.length; index++) {
          const item = data[index];
          if (!item) {
            continue;
          }
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
    top: dataLabels ? 20 : 0,
    left: axisName === "yAxis" || axisName === "both" ? 8 : 0,
    bottom: showLegend ? 20 : 0,
  };

  const chartDataWithTotalLabels = useMemo(() => {
    return chartData.map((item) => {
      const totalLabel = groupKeys.reduce((sum, key) => {
        if (barProps[key] === true) {
          return sum;
        }
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
        className="w-full"
        config={chartConfig}
        style={{ height }}
      >
        <BarChart data={chartDataWithTotalLabels} margin={chartMargin}>
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
            (() => {
              const visibleKeys = groupKeys.filter(
                (key) => barProps[key] !== true
              );
              const lastVisibleKey = visibleKeys.at(-1);

              return groupKeys.map((key, groupIndex) => {
                return (
                  <Bar
                    dataKey={key}
                    fill={colors[groupIndex % colors.length]}
                    fillOpacity={Number(
                      barProps.hover === key || !barProps.hover ? 1 : 0.2
                    )}
                    hide={barProps[key] === true}
                    isAnimationActive={false}
                    key={key}
                    radius={
                      key === lastVisibleKey ? [4, 4, 0, 0] : [0, 0, 0, 0]
                    }
                    stackId="a"
                  />
                );
              });
            })()
          ) : (
            <Bar
              dataKey="value"
              fill={colors[0]}
              isAnimationActive={false}
              radius={[4, 4, 0, 0]}
            >
              {dataLabels && (
                <LabelList
                  className="fill-foreground"
                  dataKey="value"
                  fontSize={12}
                  offset={8}
                  position="top"
                />
              )}
            </Bar>
          )}
          {dataLabels && isStacked && (
            <Bar
              activeBar={false}
              dataKey="__PLACEHOLDER_BAR__"
              fill="transparent"
              isAnimationActive={false}
              radius={[0, 0, 0, 0]}
              stackId="a"
              stroke="none"
            >
              <LabelList
                className="fill-foreground"
                dataKey={
                  barProps.hover
                    ? String(barProps.hover)
                    : "__BAR_TOTAL_LABEL__"
                }
                fontSize={12}
                offset={8}
                position="top"
              />
            </Bar>
          )}
        </BarChart>
      </ChartContainer>

      {isStacked && showLegend && (
        <ChartPaginatedLegend
          colors={colors}
          groupKeys={groupKeys}
          legendState={legendState}
          onClick={selectBar}
          onMouseOut={handleLegendMouseLeave}
          onMouseOver={handleLegendMouseEnter}
        />
      )}
    </div>
  );
}
