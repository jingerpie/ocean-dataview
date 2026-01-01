import type { ComputationType } from "../utils/compute-data";
import type { DataViewProperty } from "./property-types";

export type ChartType = "verticalBar" | "horizontalBar" | "line" | "donut";

export type GridLineType = "none" | "horizontal" | "vertical" | "both";
export type AxisNameType = "none" | "xAxis" | "yAxis" | "both";
export type DataLabelFormatType = "none" | "value" | "name" | "nameAndValue";

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
