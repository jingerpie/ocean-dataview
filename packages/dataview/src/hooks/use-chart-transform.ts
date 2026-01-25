"use client";

import { useMemo } from "react";
import {
  type ChartDataPoint,
  type ComputationType,
  computeData,
  computeGroupedData,
  getGroupCounts,
  groupByProperty,
  transformToChartData,
} from "../lib/utils/compute-data";
import { transformData } from "../lib/utils/transform-data";
import { validateChartConfig } from "../lib/utils/validate-chart-config";
import type { ChartType, DateGroupingType } from "../types/chart.type";
import type { DataViewProperty } from "../types/property-types";

// Helper: Check if showAs value is a date/status grouping type
function isDateGroupingType(
  showAs: string | undefined
): showAs is DateGroupingType | "option" | "group" {
  return (
    showAs === "day" ||
    showAs === "week" ||
    showAs === "month" ||
    showAs === "year" ||
    showAs === "relative" ||
    showAs === "option" ||
    showAs === "group"
  );
}

// Helper: Check if showAs value is a computation type
function isComputationType(
  showAs: string | undefined
): showAs is ComputationType {
  return (
    showAs === "count" ||
    showAs === "sum" ||
    showAs === "average" ||
    showAs === "median" ||
    showAs === "min" ||
    showAs === "max" ||
    showAs === "distinct"
  );
}

interface ChartConfig {
  xAxis?: {
    whatToShow:
      | { property: string; showAs?: string; startWeekOn?: "monday" | "sunday" }
      | "count"
      | { property: string; showAs: string };
    sortBy?: string;
    hideGroups?: string[];
    omitZeroValues?: boolean;
    groupBy?: { property: string; showAs?: string; sortBy?: string };
    range?: { min: number; max: number };
  };
  yAxis?: {
    whatToShow:
      | "count"
      | { property: string; showAs: string }
      | {
          property: string;
          showAs?: string;
          startWeekOn?: "monday" | "sunday";
        };
    groupBy?: { property: string; showAs?: string; sortBy?: string };
    range?: { min: number; max: number };
    sortBy?: string;
    hideGroups?: string[];
    omitZeroValues?: boolean;
  };
  data?: {
    whatToShow: {
      property: string;
      showAs?: string;
      startWeekOn?: "monday" | "sunday";
    };
    showAs: ComputationType;
    computeProperty?: string;
    sortBy?: string;
    omitZeroValues?: boolean;
  };
  style: {
    color: string;
    height: string;
    gridLine?: string;
    axisName?: string;
    dataLabels?: boolean;
    showValueInCenter?: boolean;
    showLegend?: boolean;
    dataLabelFormat?: string;
    smoothLine?: boolean;
    gradientArea?: boolean;
    showDots?: boolean;
    caption?: string;
  };
}

interface UseChartTransformResult {
  chartData: ChartDataPoint[];
  groupKeys: string[];
  xAxisLabel: string | undefined;
  yAxisLabel: string | undefined;
  validationError: string | null;
}

export function useChartTransform<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>(
  data: TData[],
  properties: TProperties,
  chartType: ChartType,
  config: ChartConfig
): UseChartTransformResult {
  // Validate configuration
  const validationError = useMemo(
    () =>
      validateChartConfig(
        chartType,
        config as Parameters<typeof validateChartConfig>[1],
        properties
      ),
    [chartType, config, properties]
  );

  // Transform data to only include property-defined fields
  const transformedData = useMemo(
    () => transformData(data, properties),
    [data, properties]
  );

  // Transform data for charts
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex chart data transformation with multiple chart types
  const chartData = useMemo(() => {
    if (validationError) {
      return [];
    }

    if (chartType === "horizontalBar" && config.xAxis && config.yAxis) {
      const yAxisWhatToShow = config.yAxis.whatToShow;
      if (
        typeof yAxisWhatToShow !== "object" ||
        !("property" in yAxisWhatToShow)
      ) {
        return [];
      }

      const yShowAs =
        "showAs" in yAxisWhatToShow ? yAxisWhatToShow.showAs : undefined;
      const yGroupingShowAs = isDateGroupingType(yShowAs) ? yShowAs : undefined;

      const { groups: grouped, sortValues } = groupByProperty(
        transformedData as TData[],
        yAxisWhatToShow.property as TProperties[number]["id"],
        properties,
        yGroupingShowAs,
        "startWeekOn" in yAxisWhatToShow
          ? yAxisWhatToShow.startWeekOn
          : undefined
      );

      const xAxisShowAs = (() => {
        if (config.xAxis.whatToShow === "count") {
          return "count";
        }
        if (
          typeof config.xAxis.whatToShow === "object" &&
          "showAs" in config.xAxis.whatToShow
        ) {
          return config.xAxis.whatToShow.showAs;
        }
        return undefined;
      })();
      const computationType: ComputationType = isComputationType(xAxisShowAs)
        ? xAxisShowAs
        : "count";

      const computeProperty = (() => {
        if (config.xAxis.whatToShow === "count") {
          return undefined;
        }
        if (
          typeof config.xAxis.whatToShow === "object" &&
          "property" in config.xAxis.whatToShow
        ) {
          return config.xAxis.whatToShow.property as TProperties[number]["id"];
        }
        return undefined;
      })();

      if (config.xAxis.groupBy) {
        const groupedComputedData = computeGroupedData(
          grouped,
          config.xAxis.groupBy.property as TProperties[number]["id"],
          properties,
          computationType,
          computeProperty,
          config.xAxis.groupBy as Parameters<typeof computeGroupedData>[5]
        );

        const allSecondaryGroupKeys = new Set<string>();
        for (const secondaryGroups of Object.values(groupedComputedData)) {
          for (const key of Object.keys(secondaryGroups)) {
            allSecondaryGroupKeys.add(key);
          }
        }

        const transformed: ChartDataPoint[] = Object.entries(
          groupedComputedData
        ).map(([yAxisKey, secondaryGroups]) => {
          const dataPoint: ChartDataPoint = {
            name: yAxisKey,
            sortValue: sortValues[yAxisKey],
          };
          let total = 0;
          for (const groupKey of allSecondaryGroupKeys) {
            const value = secondaryGroups[groupKey] || 0;
            dataPoint[groupKey] = value;
            total += value;
          }
          dataPoint._total = total;
          return dataPoint;
        });

        let result = transformed;

        if (config.yAxis.omitZeroValues) {
          result = result.filter((point) => {
            const values = Object.keys(point)
              .filter((k) => k !== "name" && k !== "sortValue")
              .map((k) => point[k]);
            return values.some((v) => v !== 0);
          });
        }

        if (config.yAxis.hideGroups && config.yAxis.hideGroups.length > 0) {
          result = result.filter(
            (point) => !config.yAxis?.hideGroups?.includes(String(point.name))
          );
        }

        if (config.yAxis.sortBy) {
          // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex sorting logic for multiple sort modes
          result.sort((a, b) => {
            if (config.yAxis?.sortBy === "propertyAscending") {
              if (a.sortValue !== undefined && b.sortValue !== undefined) {
                if (
                  typeof a.sortValue === "number" &&
                  typeof b.sortValue === "number"
                ) {
                  return a.sortValue - b.sortValue;
                }
                return String(a.sortValue).localeCompare(String(b.sortValue));
              }
              return String(a.name).localeCompare(String(b.name));
            }
            if (config.yAxis?.sortBy === "propertyDescending") {
              if (a.sortValue !== undefined && b.sortValue !== undefined) {
                if (
                  typeof a.sortValue === "number" &&
                  typeof b.sortValue === "number"
                ) {
                  return b.sortValue - a.sortValue;
                }
                return String(b.sortValue).localeCompare(String(a.sortValue));
              }
              return String(b.name).localeCompare(String(a.name));
            }
            if (
              config.yAxis?.sortBy === "countAscending" ||
              config.yAxis?.sortBy === "countDescending"
            ) {
              const aTotal = (a._total as number) || 0;
              const bTotal = (b._total as number) || 0;
              return config.yAxis?.sortBy === "countAscending"
                ? aTotal - bTotal
                : bTotal - aTotal;
            }
            return 0;
          });
        }

        return result;
      }

      const computed = computeData(
        grouped,
        computationType,
        computeProperty,
        properties
      );

      const transformed = transformToChartData(
        computed,
        config.yAxis.sortBy as Parameters<typeof transformToChartData>[1],
        config.yAxis.omitZeroValues,
        config.yAxis.hideGroups,
        sortValues
      );

      const counts = getGroupCounts(grouped);
      return transformed.map((point) => ({
        ...point,
        count: counts[point.name] || 0,
      }));
    }

    if (chartType === "donut" && config.data) {
      const whatToShow = config.data.whatToShow;
      const { groups: grouped, sortValues } = groupByProperty(
        transformedData as TData[],
        whatToShow.property as TProperties[number]["id"],
        properties,
        whatToShow.showAs as DateGroupingType | "option" | "group" | undefined,
        whatToShow.startWeekOn
      );

      const computed = computeData(
        grouped,
        config.data.showAs,
        config.data.computeProperty as TProperties[number]["id"] | undefined,
        properties
      );

      return transformToChartData(
        computed,
        config.data.sortBy as Parameters<typeof transformToChartData>[1],
        config.data.omitZeroValues,
        undefined,
        sortValues
      );
    }

    if (config.xAxis && config.yAxis) {
      const xAxisWhatToShow = config.xAxis.whatToShow;
      if (
        typeof xAxisWhatToShow !== "object" ||
        !("property" in xAxisWhatToShow)
      ) {
        return [];
      }

      const xShowAs =
        "showAs" in xAxisWhatToShow ? xAxisWhatToShow.showAs : undefined;
      const xGroupingShowAs = isDateGroupingType(xShowAs) ? xShowAs : undefined;

      const { groups: grouped, sortValues } = groupByProperty(
        transformedData as TData[],
        xAxisWhatToShow.property as TProperties[number]["id"],
        properties,
        xGroupingShowAs,
        "startWeekOn" in xAxisWhatToShow
          ? xAxisWhatToShow.startWeekOn
          : undefined
      );

      const yAxisWhatToShow = config.yAxis.whatToShow;
      const yShowAs = (() => {
        if (yAxisWhatToShow === "count") {
          return "count";
        }
        if (
          typeof yAxisWhatToShow === "object" &&
          "showAs" in yAxisWhatToShow
        ) {
          return yAxisWhatToShow.showAs;
        }
        return undefined;
      })();
      const computationType: ComputationType = isComputationType(yShowAs)
        ? yShowAs
        : "count";

      const computeProperty = (() => {
        if (yAxisWhatToShow === "count") {
          return undefined;
        }
        if (
          typeof yAxisWhatToShow === "object" &&
          "property" in yAxisWhatToShow
        ) {
          return yAxisWhatToShow.property as TProperties[number]["id"];
        }
        return undefined;
      })();

      if (config.yAxis.groupBy) {
        const groupedComputedData = computeGroupedData(
          grouped,
          config.yAxis.groupBy.property as TProperties[number]["id"],
          properties,
          computationType,
          computeProperty,
          config.yAxis.groupBy as Parameters<typeof computeGroupedData>[5]
        );

        const allSecondaryGroupKeys = new Set<string>();
        for (const secondaryGroups of Object.values(groupedComputedData)) {
          for (const key of Object.keys(secondaryGroups)) {
            allSecondaryGroupKeys.add(key);
          }
        }

        const transformed: ChartDataPoint[] = Object.entries(
          groupedComputedData
        ).map(([xAxisKey, secondaryGroups]) => {
          const dataPoint: ChartDataPoint = {
            name: xAxisKey,
            sortValue: sortValues[xAxisKey],
          };
          let total = 0;
          for (const groupKey of allSecondaryGroupKeys) {
            const value = secondaryGroups[groupKey] || 0;
            dataPoint[groupKey] = value;
            total += value;
          }
          dataPoint._total = total;
          return dataPoint;
        });

        let result = transformed;

        if (config.xAxis.omitZeroValues) {
          result = result.filter((point) => {
            const values = Object.keys(point)
              .filter((k) => k !== "name" && k !== "sortValue")
              .map((k) => point[k]);
            return values.some((v) => v !== 0);
          });
        }

        if (config.xAxis.hideGroups && config.xAxis.hideGroups.length > 0) {
          result = result.filter(
            (point) => !config.xAxis?.hideGroups?.includes(String(point.name))
          );
        }

        if (config.xAxis.sortBy) {
          // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex sorting logic for multiple sort modes
          result.sort((a, b) => {
            if (config.xAxis?.sortBy === "propertyAscending") {
              if (a.sortValue !== undefined && b.sortValue !== undefined) {
                if (
                  typeof a.sortValue === "number" &&
                  typeof b.sortValue === "number"
                ) {
                  return a.sortValue - b.sortValue;
                }
                return String(a.sortValue).localeCompare(String(b.sortValue));
              }
              return String(a.name).localeCompare(String(b.name));
            }
            if (config.xAxis?.sortBy === "propertyDescending") {
              if (a.sortValue !== undefined && b.sortValue !== undefined) {
                if (
                  typeof a.sortValue === "number" &&
                  typeof b.sortValue === "number"
                ) {
                  return b.sortValue - a.sortValue;
                }
                return String(b.sortValue).localeCompare(String(a.sortValue));
              }
              return String(b.name).localeCompare(String(a.name));
            }
            if (
              config.xAxis?.sortBy === "countAscending" ||
              config.xAxis?.sortBy === "countDescending"
            ) {
              const aTotal = (a._total as number) || 0;
              const bTotal = (b._total as number) || 0;
              return config.xAxis?.sortBy === "countAscending"
                ? aTotal - bTotal
                : bTotal - aTotal;
            }
            return 0;
          });
        }

        return result;
      }

      const computed = computeData(
        grouped,
        computationType,
        computeProperty,
        properties
      );

      const transformed = transformToChartData(
        computed,
        config.xAxis.sortBy as Parameters<typeof transformToChartData>[1],
        config.xAxis.omitZeroValues,
        config.xAxis.hideGroups,
        sortValues
      );

      const counts = getGroupCounts(grouped);
      return transformed.map((point) => ({
        ...point,
        count: counts[point.name] || 0,
      }));
    }

    return [];
  }, [transformedData, properties, chartType, config, validationError]);

  // Get group keys for stacked charts
  const groupKeys = useMemo(() => {
    if (chartData.length === 0) {
      return [];
    }
    const firstDataPoint = chartData[0];
    if (!firstDataPoint) {
      return [];
    }
    const reservedKeys = [
      "name",
      "sortValue",
      "count",
      "percentage",
      "value",
      "_total",
    ];
    const keys = Object.keys(firstDataPoint).filter(
      (key) => !reservedKeys.includes(key)
    );

    const sortBy =
      chartType === "horizontalBar"
        ? config.xAxis?.groupBy?.sortBy
        : config.yAxis?.groupBy?.sortBy;

    if (sortBy && keys.length > 0) {
      keys.sort((a, b) => {
        if (sortBy === "propertyAscending") {
          return a.localeCompare(b);
        }
        if (sortBy === "propertyDescending") {
          return b.localeCompare(a);
        }
        return 0;
      });
    }

    return keys;
  }, [
    chartData,
    chartType,
    config.yAxis?.groupBy?.sortBy,
    config.xAxis?.groupBy?.sortBy,
  ]);

  // Get axis labels
  const xAxisLabel = useMemo(() => {
    if (chartType === "horizontalBar") {
      const xAxisWhatToShow = config.xAxis?.whatToShow;
      if (xAxisWhatToShow === "count") {
        return "Count";
      }
      if (
        typeof xAxisWhatToShow === "object" &&
        "property" in xAxisWhatToShow
      ) {
        const property = properties.find(
          (p) => p.id === xAxisWhatToShow.property
        );
        return property?.label;
      }
      return undefined;
    }
    const xAxisWhatToShow = config.xAxis?.whatToShow;
    if (typeof xAxisWhatToShow === "object" && "property" in xAxisWhatToShow) {
      const property = properties.find(
        (p) => p.id === xAxisWhatToShow.property
      );
      return property?.label;
    }
    return undefined;
  }, [chartType, config.xAxis?.whatToShow, properties]);

  const yAxisLabel = useMemo(() => {
    if (chartType === "horizontalBar") {
      const yAxisWhatToShow = config.yAxis?.whatToShow;
      if (
        typeof yAxisWhatToShow === "object" &&
        "property" in yAxisWhatToShow
      ) {
        const property = properties.find(
          (p) => p.id === yAxisWhatToShow.property
        );
        return property?.label;
      }
      return undefined;
    }
    const yAxisWhatToShow = config.yAxis?.whatToShow;
    if (yAxisWhatToShow === "count") {
      return "Count";
    }
    if (typeof yAxisWhatToShow === "object" && "property" in yAxisWhatToShow) {
      const property = properties.find(
        (p) => p.id === yAxisWhatToShow.property
      );
      return property?.label;
    }
    return undefined;
  }, [chartType, config.yAxis?.whatToShow, properties]);

  return {
    chartData,
    groupKeys,
    xAxisLabel,
    yAxisLabel,
    validationError,
  };
}
