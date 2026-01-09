"use client";

import { AlertCircle } from "lucide-react";
import { useMemo } from "react";
import {
	getChartColors,
	getChartHeight,
} from "../../../lib/utils/chart-colors";
import {
	type ChartDataPoint,
	type ComputationType,
	computeData,
	computeGroupedData,
	getGroupCounts,
	groupByProperty,
	transformToChartData,
} from "../../../lib/utils/compute-data";
import { transformData } from "../../../lib/utils/transform-data";
import { validateChartConfig } from "../../../lib/utils/validate-chart-config";
import type {
	ChartViewProps,
	DateGroupingType,
} from "../../../types/chart.type";
import { AreaChart } from "./area-chart";
import { DonutChart } from "./donut-chart";
import { HorizontalBarChart } from "./horizontal-bar-chart";
import { LineChart } from "./line-chart";
import { VerticalBarChart } from "./vertical-bar-chart";

// Helper: Check if showAs value is a date/status grouping type
function isDateGroupingType(
	showAs: string | undefined,
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
	showAs: string | undefined,
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

/**
 * ChartView with data aggregation
 * Visualizes data with various chart types (bar, line, donut)
 */
export function ChartView<
	TData,
	TProperties extends
		readonly import("@ocean-dataview/dataview/types").DataViewProperty<TData>[] = import("@ocean-dataview/dataview/types").DataViewProperty<TData>[],
>({ data, properties, chartType, config }: ChartViewProps<TData, TProperties>) {
	// Validate configuration
	const validationError = useMemo(
		() => validateChartConfig(chartType, config, properties),
		[chartType, config, properties],
	);

	// Transform data to only include property-defined fields
	const transformedData = useMemo(
		() => transformData(data, properties),
		[data, properties],
	);

	// Transform data for charts
	const chartData = useMemo(() => {
		if (validationError) return [];

		if (chartType === "horizontalBar" && config.xAxis && config.yAxis) {
			// Horizontal bar chart transformation
			// For horizontal: yAxis shows categories (left), xAxis shows values (bottom)
			const yAxisWhatToShow = config.yAxis.whatToShow;
			if (
				typeof yAxisWhatToShow !== "object" ||
				!("property" in yAxisWhatToShow)
			) {
				return [];
			}

			// For horizontal bar, yAxis is for categories (grouping), not aggregation
			const yShowAs =
				"showAs" in yAxisWhatToShow ? yAxisWhatToShow.showAs : undefined;
			const yGroupingShowAs = isDateGroupingType(yShowAs) ? yShowAs : undefined;

			const { groups: grouped, sortValues } = groupByProperty(
				transformedData as TData[],
				yAxisWhatToShow.property,
				properties,
				yGroupingShowAs,
				"startWeekOn" in yAxisWhatToShow
					? yAxisWhatToShow.startWeekOn
					: undefined,
			);

			// Determine computation type from X-axis (values)
			const xAxisShowAs =
				config.xAxis.whatToShow === "count"
					? "count"
					: typeof config.xAxis.whatToShow === "object" &&
							"showAs" in config.xAxis.whatToShow
						? config.xAxis.whatToShow.showAs
						: undefined;
			const computationType: ComputationType = isComputationType(xAxisShowAs)
				? xAxisShowAs
				: "count";

			const computeProperty =
				config.xAxis.whatToShow === "count"
					? undefined
					: typeof config.xAxis.whatToShow === "object" &&
							"property" in config.xAxis.whatToShow
						? config.xAxis.whatToShow.property
						: undefined;

			// Check if we have groupBy for stacked/grouped charts
			if (config.xAxis.groupBy) {
				const groupedComputedData = computeGroupedData(
					grouped,
					config.xAxis.groupBy.property,
					properties,
					computationType,
					computeProperty,
					config.xAxis.groupBy,
				);

				// Collect ALL unique secondary group keys
				const allSecondaryGroupKeys = new Set<string>();
				for (const secondaryGroups of Object.values(groupedComputedData)) {
					for (const key of Object.keys(secondaryGroups)) {
						allSecondaryGroupKeys.add(key);
					}
				}

				// Transform to chart format with all keys and pre-computed total
				const transformed: ChartDataPoint[] = Object.entries(
					groupedComputedData,
				).map(([yAxisKey, secondaryGroups]) => {
					const dataPoint: ChartDataPoint = {
						name: yAxisKey,
						sortValue: sortValues[yAxisKey],
					};
					let total = 0;
					allSecondaryGroupKeys.forEach((groupKey) => {
						const value = secondaryGroups[groupKey] || 0;
						dataPoint[groupKey] = value;
						total += value;
					});
					// Pre-compute total for sorting
					dataPoint._total = total;
					return dataPoint;
				});

				// Apply sorting and filtering
				let chartData = transformed;

				if (config.yAxis.omitZeroValues) {
					chartData = chartData.filter((point) => {
						const values = Object.keys(point)
							.filter((k) => k !== "name" && k !== "sortValue")
							.map((k) => point[k]);
						return values.some((v) => v !== 0);
					});
				}

				if (config.yAxis.hideGroups && config.yAxis.hideGroups.length > 0) {
					chartData = chartData.filter(
						(point) => !config.yAxis?.hideGroups?.includes(String(point.name)),
					);
				}

				// Sort data
				if (config.yAxis.sortBy) {
					chartData.sort((a, b) => {
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
							// Use pre-computed total for count sorting
							const aTotal = (a._total as number) || 0;
							const bTotal = (b._total as number) || 0;
							return config.yAxis?.sortBy === "countAscending"
								? aTotal - bTotal
								: bTotal - aTotal;
						}
						return 0;
					});
				}

				return chartData;
			}
			// Simple (non-grouped) horizontal bar chart
			const computed = computeData(
				grouped,
				computationType,
				computeProperty,
				properties,
			);

			const transformed = transformToChartData(
				computed,
				config.yAxis.sortBy,
				config.yAxis.omitZeroValues,
				config.yAxis.hideGroups,
				sortValues,
			);

			// Add raw counts for tooltips
			const counts = getGroupCounts(grouped);
			return transformed.map((point) => ({
				...point,
				count: counts[point.name] || 0,
			}));
		}
		if (chartType === "donut" && config.data) {
			// Donut chart transformation
			const whatToShow = config.data.whatToShow;
			const { groups: grouped, sortValues } = groupByProperty(
				transformedData as TData[],
				whatToShow.property,
				properties,
				whatToShow.showAs,
				"startWeekOn" in whatToShow ? whatToShow.startWeekOn : undefined,
			);

			const computed = computeData(
				grouped,
				config.data.showAs,
				config.data.computeProperty,
				properties,
			);

			return transformToChartData(
				computed,
				config.data.sortBy,
				config.data.omitZeroValues,
				undefined,
				sortValues,
			);
		}
		if (config.xAxis && config.yAxis) {
			// Vertical bar and line charts transformation
			const xAxisWhatToShow = config.xAxis.whatToShow;
			if (
				typeof xAxisWhatToShow !== "object" ||
				!("property" in xAxisWhatToShow)
			) {
				return [];
			}

			// For vertical bar/line, xAxis is for categories (grouping), not aggregation
			const xShowAs =
				"showAs" in xAxisWhatToShow ? xAxisWhatToShow.showAs : undefined;
			const xGroupingShowAs = isDateGroupingType(xShowAs) ? xShowAs : undefined;

			const { groups: grouped, sortValues } = groupByProperty(
				transformedData as TData[],
				xAxisWhatToShow.property,
				properties,
				xGroupingShowAs,
				"startWeekOn" in xAxisWhatToShow
					? xAxisWhatToShow.startWeekOn
					: undefined,
			);

			// Determine computation type from Y-axis (values)
			const yAxisWhatToShow = config.yAxis.whatToShow;
			const yShowAs =
				yAxisWhatToShow === "count"
					? "count"
					: typeof yAxisWhatToShow === "object" && "showAs" in yAxisWhatToShow
						? yAxisWhatToShow.showAs
						: undefined;
			const computationType: ComputationType = isComputationType(yShowAs)
				? yShowAs
				: "count";

			const computeProperty =
				yAxisWhatToShow === "count"
					? undefined
					: typeof yAxisWhatToShow === "object" && "property" in yAxisWhatToShow
						? yAxisWhatToShow.property
						: undefined;

			// Check if we have groupBy for stacked/grouped charts
			if (config.yAxis.groupBy) {
				const groupedComputedData = computeGroupedData(
					grouped,
					config.yAxis.groupBy.property,
					properties,
					computationType,
					computeProperty,
					config.yAxis.groupBy,
				);

				// Collect ALL unique secondary group keys across all x-axis groups
				const allSecondaryGroupKeys = new Set<string>();
				for (const secondaryGroups of Object.values(groupedComputedData)) {
					for (const key of Object.keys(secondaryGroups)) {
						allSecondaryGroupKeys.add(key);
					}
				}

				// Transform to chart format: { name: "Week 1", low: 5, medium: 10, high: 3, _total: 18 }
				// Ensure ALL secondary groups are present in EVERY data point (with 0 if missing)
				const transformed: ChartDataPoint[] = Object.entries(
					groupedComputedData,
				).map(([xAxisKey, secondaryGroups]) => {
					const dataPoint: ChartDataPoint = {
						name: xAxisKey,
						sortValue: sortValues[xAxisKey],
					};
					// Add ALL secondary groups, defaulting to 0 if not present
					let total = 0;
					allSecondaryGroupKeys.forEach((groupKey) => {
						const value = secondaryGroups[groupKey] || 0;
						dataPoint[groupKey] = value;
						total += value;
					});
					// Pre-compute total for sorting and display
					dataPoint._total = total;
					return dataPoint;
				});

				// Apply sorting and filtering
				let chartData = transformed;

				if (config.xAxis.omitZeroValues) {
					chartData = chartData.filter((point) => {
						// Check if all values are zero
						const values = Object.keys(point)
							.filter((k) => k !== "name" && k !== "sortValue")
							.map((k) => point[k]);
						return values.some((v) => v !== 0);
					});
				}

				if (config.xAxis.hideGroups && config.xAxis.hideGroups.length > 0) {
					chartData = chartData.filter(
						(point) => !config.xAxis?.hideGroups?.includes(String(point.name)),
					);
				}

				// Sort data
				if (config.xAxis.sortBy) {
					chartData.sort((a, b) => {
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
							// Use pre-computed total for count sorting
							const aTotal = (a._total as number) || 0;
							const bTotal = (b._total as number) || 0;
							return config.xAxis?.sortBy === "countAscending"
								? aTotal - bTotal
								: bTotal - aTotal;
						}
						return 0;
					});
				}

				return chartData;
			}
			// Simple (non-grouped) chart
			const computed = computeData(
				grouped,
				computationType,
				computeProperty,
				properties,
			);

			const transformed = transformToChartData(
				computed,
				config.xAxis.sortBy,
				config.xAxis.omitZeroValues,
				config.xAxis.hideGroups,
				sortValues,
			);

			// Add raw counts for tooltips
			const counts = getGroupCounts(grouped);
			return transformed.map((point) => ({
				...point,
				count: counts[point.name] || 0,
			}));
		}

		return [];
	}, [transformedData, properties, chartType, config, validationError]);

	// Get visualization properties
	const height = getChartHeight(config.style.height);

	// Get group keys for stacked charts (all keys except 'name', 'sortValue', 'count', 'percentage', 'value', '_total')
	const groupKeys = useMemo(() => {
		if (chartData.length === 0) return [];
		const firstDataPoint = chartData[0];
		if (!firstDataPoint) return [];
		const reservedKeys = [
			"name",
			"sortValue",
			"count",
			"percentage",
			"value",
			"_total",
		];
		const keys = Object.keys(firstDataPoint).filter(
			(key) => !reservedKeys.includes(key),
		);

		// Apply sorting if groupBy.sortBy is specified
		// For horizontal bar charts, groupBy is in xAxis
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

	const colors = getChartColors(
		config.style.color,
		groupKeys.length > 0 ? groupKeys.length : chartData.length,
	);

	// Get axis labels
	const xAxisLabel = useMemo(() => {
		if (chartType === "horizontalBar") {
			// For horizontal bar: X-axis shows values
			const xAxisWhatToShow = config.xAxis?.whatToShow;
			if (xAxisWhatToShow === "count") return "Count";
			if (
				typeof xAxisWhatToShow === "object" &&
				"property" in xAxisWhatToShow
			) {
				const property = properties.find(
					(p) => p.id === xAxisWhatToShow.property,
				);
				return property?.label;
			}
			return undefined;
		}
		// For vertical charts: X-axis shows categories
		const xAxisWhatToShow = config.xAxis?.whatToShow;
		if (typeof xAxisWhatToShow === "object" && "property" in xAxisWhatToShow) {
			const property = properties.find(
				(p) => p.id === xAxisWhatToShow.property,
			);
			return property?.label;
		}
		return undefined;
	}, [chartType, config.xAxis?.whatToShow, properties]);

	const yAxisLabel = useMemo(() => {
		if (chartType === "horizontalBar") {
			// For horizontal bar: Y-axis shows categories
			const yAxisWhatToShow = config.yAxis?.whatToShow;
			if (
				typeof yAxisWhatToShow === "object" &&
				"property" in yAxisWhatToShow
			) {
				const property = properties.find(
					(p) => p.id === yAxisWhatToShow.property,
				);
				return property?.label;
			}
			return undefined;
		}
		// For vertical charts: Y-axis shows values
		const yAxisWhatToShow = config.yAxis?.whatToShow;
		if (yAxisWhatToShow === "count") return "Count";
		if (typeof yAxisWhatToShow === "object" && "property" in yAxisWhatToShow) {
			const property = properties.find(
				(p) => p.id === yAxisWhatToShow.property,
			);
			return property?.label;
		}
		return undefined;
	}, [chartType, config.yAxis?.whatToShow, properties]);

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

	// Display chart based on type
	return (
		<div className="flex flex-col gap-4">
			{config.style.caption && (
				<h3 className="font-semibold text-foreground text-lg">
					{config.style.caption}
				</h3>
			)}

			<div className="rounded-lg border bg-card p-4">
				{chartType === "verticalBar" && (
					<VerticalBarChart
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
				)}

				{chartType === "horizontalBar" && (
					<HorizontalBarChart
						data={chartData}
						height={height}
						colors={colors}
						colorScheme={config.style.color}
						gridLine={config.style.gridLine}
						axisName={config.style.axisName}
						dataLabels={config.style.dataLabels}
						xAxisLabel={xAxisLabel}
						yAxisLabel={yAxisLabel}
						xAxisRange={config.xAxis?.range}
						groupKeys={groupKeys}
						showLegend={config.style.showLegend}
					/>
				)}

				{chartType === "line" &&
					(config.style.gradientArea ? (
						<AreaChart
							data={chartData}
							height={height}
							colors={colors}
							colorScheme={config.style.color}
							gridLine={config.style.gridLine}
							axisName={config.style.axisName}
							xAxisLabel={xAxisLabel}
							yAxisLabel={yAxisLabel}
							yAxisRange={config.yAxis?.range}
							smoothLine={config.style.smoothLine}
							showLegend={config.style.showLegend}
							showDots={config.style.showDots}
							groupKeys={groupKeys}
						/>
					) : (
						<LineChart
							data={chartData}
							height={height}
							colors={colors}
							gridLine={config.style.gridLine}
							axisName={config.style.axisName}
							dataLabels={config.style.dataLabels}
							xAxisLabel={xAxisLabel}
							yAxisLabel={yAxisLabel}
							yAxisRange={config.yAxis?.range}
							smoothLine={config.style.smoothLine}
							showLegend={config.style.showLegend}
							showDots={config.style.showDots}
							groupKeys={groupKeys}
						/>
					))}

				{chartType === "donut" && (
					<DonutChart
						data={chartData}
						height={height}
						colors={colors}
						showValueInCenter={config.style.showValueInCenter}
						showLegend={config.style.showLegend}
						dataLabelFormat={config.style.dataLabelFormat}
					/>
				)}
			</div>
		</div>
	);
}
