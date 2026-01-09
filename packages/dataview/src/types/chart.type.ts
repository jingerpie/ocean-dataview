import type { ComputationType } from "../lib/utils/compute-data";
import type { DataViewProperty } from "./property-types";

export type ChartType = "verticalBar" | "horizontalBar" | "line" | "donut";

export type GridLineType = "none" | "horizontal" | "vertical" | "both";
export type AxisNameType = "none" | "xAxis" | "yAxis" | "both";
export type DataLabelFormatType = "none" | "value" | "name" | "nameAndValue";

export type ChartColorScheme =
	| "colorful"
	| "colorless"
	| "blue"
	| "yellow"
	| "green"
	| "purple"
	| "teal"
	| "orange"
	| "pink"
	| "red";

export type ChartHeight = "small" | "medium" | "large" | "extraLarge";

export type SortByType =
	| "propertyAscending"
	| "propertyDescending"
	| "countAscending"
	| "countDescending";

export type GroupBySortByType = "propertyAscending" | "propertyDescending";

export type DateShowAsType =
	| "relative"
	| "day"
	| "week"
	| "month"
	| "year"
	| "group"
	| "option";

// ============================================================================
// Individual Chart Config Types
// ============================================================================

/**
 * Vertical Bar Chart Configuration
 * - xAxis: Categories (bottom)
 * - yAxis: Values (left)
 */
export interface VerticalBarChartConfig<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
> {
	xAxis: {
		whatToShow: {
			property: TProperties[number]["id"];
			showAs?: DateShowAsType;
			startWeekOn?: "monday" | "sunday";
		};
		sortBy?: SortByType;
		hideGroups?: string[];
		omitZeroValues?: boolean;
	};
	yAxis: {
		whatToShow:
			| "count"
			| {
					property: TProperties[number]["id"];
					showAs: Exclude<ComputationType, "count">;
			  };
		groupBy?: {
			property: TProperties[number]["id"];
			showAs?: DateShowAsType;
			sortBy?: GroupBySortByType;
		};
		range?: { min: number; max: number };
	};
	style: {
		color: ChartColorScheme;
		height: ChartHeight;
		gridLine?: GridLineType;
		axisName?: AxisNameType;
		dataLabels?: boolean;
		showLegend?: boolean;
		caption?: string;
	};
}

/**
 * Horizontal Bar Chart Configuration
 * - xAxis: Values (bottom)
 * - yAxis: Categories (left)
 */
export interface HorizontalBarChartConfig<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
> {
	xAxis: {
		whatToShow:
			| "count"
			| {
					property: TProperties[number]["id"];
					showAs: Exclude<ComputationType, "count">;
			  };
		groupBy?: {
			property: TProperties[number]["id"];
			showAs?: DateShowAsType;
			sortBy?: GroupBySortByType;
		};
		range?: { min: number; max: number };
	};
	yAxis: {
		whatToShow: {
			property: TProperties[number]["id"];
			showAs?: DateShowAsType;
			startWeekOn?: "monday" | "sunday";
		};
		sortBy?: SortByType;
		hideGroups?: string[];
		omitZeroValues?: boolean;
	};
	style: {
		color: ChartColorScheme;
		height: ChartHeight;
		gridLine?: GridLineType;
		axisName?: AxisNameType;
		dataLabels?: boolean;
		showLegend?: boolean;
		caption?: string;
	};
}

/**
 * Line Chart Configuration
 * - xAxis: Categories (bottom)
 * - yAxis: Values (left)
 */
export interface LineChartConfig<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
> {
	xAxis: {
		whatToShow: {
			property: TProperties[number]["id"];
			showAs?: DateShowAsType;
			startWeekOn?: "monday" | "sunday";
		};
		sortBy?: SortByType;
		hideGroups?: string[];
		omitZeroValues?: boolean;
	};
	yAxis: {
		whatToShow:
			| "count"
			| {
					property: TProperties[number]["id"];
					showAs: Exclude<ComputationType, "count">;
			  };
		groupBy?: {
			property: TProperties[number]["id"];
			showAs?: DateShowAsType;
			sortBy?: GroupBySortByType;
		};
		range?: { min: number; max: number };
	};
	style: {
		color: ChartColorScheme;
		height: ChartHeight;
		gridLine?: GridLineType;
		axisName?: AxisNameType;
		smoothLine?: boolean;
		showLegend?: boolean;
		showDots?: boolean;
		caption?: string;
	};
}

/**
 * Area Chart Configuration (Line chart with gradient fill)
 * - xAxis: Categories (bottom)
 * - yAxis: Values (left)
 */
export interface AreaChartConfig<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
> {
	xAxis: {
		whatToShow: {
			property: TProperties[number]["id"];
			showAs?: DateShowAsType;
			startWeekOn?: "monday" | "sunday";
		};
		sortBy?: SortByType;
		hideGroups?: string[];
		omitZeroValues?: boolean;
	};
	yAxis: {
		whatToShow:
			| "count"
			| {
					property: TProperties[number]["id"];
					showAs: Exclude<ComputationType, "count">;
			  };
		groupBy?: {
			property: TProperties[number]["id"];
			showAs?: DateShowAsType;
			sortBy?: GroupBySortByType;
		};
		range?: { min: number; max: number };
	};
	style: {
		color: ChartColorScheme;
		height: ChartHeight;
		gridLine?: GridLineType;
		axisName?: AxisNameType;
		smoothLine?: boolean;
		showLegend?: boolean;
		showDots?: boolean;
		caption?: string;
	};
}

/**
 * Donut Chart Configuration
 */
export interface DonutChartConfig<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
> {
	data: {
		whatToShow: {
			property: TProperties[number]["id"];
			showAs?: DateShowAsType;
			startWeekOn?: "monday" | "sunday";
		};
		showAs: ComputationType;
		computeProperty?: TProperties[number]["id"];
		sortBy?: SortByType;
		omitZeroValues?: boolean;
	};
	style: {
		color: ChartColorScheme;
		height: ChartHeight;
		showValueInCenter?: boolean;
		showLegend?: boolean;
		dataLabelFormat?: DataLabelFormatType;
		caption?: string;
	};
}

// Type aliases for internal use (helper functions, runtime checks)
export type DateGroupingType = "relative" | "day" | "week" | "month" | "year";
export type StatusGroupingType = "group" | "option";

export interface ChartViewProps<
	TData,
	TProperties extends
		readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
> {
	/**
	 * Data to visualize
	 */
	data: TData[];

	/**
	 * Property definitions
	 */
	properties: TProperties;

	/**
	 * Chart type
	 */
	chartType: "verticalBar" | "horizontalBar" | "line" | "donut";

	/**
	 * Chart configuration
	 *
	 * FOR VERTICAL BAR, LINE, AND AREA CHARTS:
	 * - xAxis: Categories (on bottom)
	 * - yAxis: Numeric values (on left)
	 *
	 * FOR HORIZONTAL BAR CHARTS:
	 * - xAxis: Numeric values (on bottom)
	 * - yAxis: Categories (on left)
	 */
	config: {
		/**
		 * X-axis configuration
		 * - verticalBar/line/area: Shows categories (property-based)
		 * - horizontalBar: Shows numeric values (count or aggregation)
		 */
		xAxis?: {
			whatToShow:
				| {
						property: TProperties[number]["id"];
						// For date properties: 'day' | 'week' | 'month' | 'year' | 'relative'
						// For status properties: 'option' | 'group'
						showAs?:
							| "relative"
							| "day"
							| "week"
							| "month"
							| "year"
							| "group"
							| "option";
						startWeekOn?: "monday" | "sunday";
				  }
				| "count"
				| {
						property: TProperties[number]["id"];
						showAs: Exclude<ComputationType, "count">;
				  };
			sortBy?:
				| "propertyAscending"
				| "propertyDescending"
				| "countAscending"
				| "countDescending";
			hideGroups?: string[];
			omitZeroValues?: boolean;
			groupBy?: {
				property: TProperties[number]["id"];
				// For date properties: 'day' | 'week' | 'month' | 'year' | 'relative'
				// For status properties: 'option' | 'group'
				showAs?:
					| "relative"
					| "day"
					| "week"
					| "month"
					| "year"
					| "group"
					| "option";
				sortBy?: "propertyAscending" | "propertyDescending";
			};
			range?: { min: number; max: number };
		};

		/**
		 * Y-axis configuration
		 * - verticalBar/line/area: Shows numeric values (count or aggregation)
		 * - horizontalBar: Shows categories (property-based)
		 */
		yAxis?: {
			whatToShow:
				| "count"
				| {
						property: TProperties[number]["id"];
						showAs: Exclude<ComputationType, "count">;
				  }
				| {
						property: TProperties[number]["id"];
						// For date properties: 'day' | 'week' | 'month' | 'year' | 'relative'
						// For status properties: 'option' | 'group'
						showAs?:
							| "day"
							| "week"
							| "month"
							| "year"
							| "relative"
							| "option"
							| "group";
						startWeekOn?: "monday" | "sunday";
				  };
			groupBy?: {
				property: TProperties[number]["id"];
				// For date properties: 'day' | 'week' | 'month' | 'year' | 'relative'
				// For status properties: 'option' | 'group'
				showAs?:
					| "day"
					| "week"
					| "month"
					| "year"
					| "relative"
					| "option"
					| "group";
				sortBy?: "propertyAscending" | "propertyDescending";
			};
			range?: { min: number; max: number };
			sortBy?:
				| "propertyAscending"
				| "propertyDescending"
				| "countAscending"
				| "countDescending";
			hideGroups?: string[];
			omitZeroValues?: boolean;
		};

		/**
		 * Data configuration (for donut chart)
		 */
		data?: {
			whatToShow: {
				property: TProperties[number]["id"];
				// For date properties: 'day' | 'week' | 'month' | 'year' | 'relative'
				// For status properties: 'option' | 'group'
				showAs?:
					| "day"
					| "week"
					| "month"
					| "year"
					| "relative"
					| "option"
					| "group";
				startWeekOn?: "monday" | "sunday";
			};
			showAs: ComputationType;
			computeProperty?: TProperties[number]["id"];
			sortBy?:
				| "propertyAscending"
				| "propertyDescending"
				| "countAscending"
				| "countDescending";
			omitZeroValues?: boolean;
		};

		/**
		 * Style configuration
		 */
		style: {
			color:
				| "colorful"
				| "colorless"
				| "blue"
				| "yellow"
				| "green"
				| "purple"
				| "teal"
				| "orange"
				| "pink"
				| "red";
			height: "small" | "medium" | "large" | "extraLarge";
			gridLine?: "none" | "horizontal" | "vertical" | "both";
			axisName?: "none" | "xAxis" | "yAxis" | "both";
			dataLabels?: boolean;
			showValueInCenter?: boolean;
			showLegend?: boolean;
			dataLabelFormat?: "none" | "value" | "name" | "nameAndValue";
			smoothLine?: boolean;
			gradientArea?: boolean;
			showDots?: boolean;
			caption?: string;
		};
	};
}
