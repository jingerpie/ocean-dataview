import type { ChartViewProps } from "../types/chart.type";
import type { DataViewProperty } from "../types/property.type";

/**
 * Validates showAs configuration based on property type
 * @returns Error message if invalid, null if valid
 */
function validateShowAs(
  propertyType: string,
  propertyKey: string,
  showAs: string | undefined
): string | null {
  if (!showAs) {
    return null;
  }

  // Check date property with date-specific showAs
  if (propertyType === "date") {
    const validDateShowAs = ["day", "week", "month", "year", "relative"];
    if (!validDateShowAs.includes(showAs)) {
      return `Property "${propertyKey}" is type 'date' and cannot use showAs: '${showAs}'. Valid options for date properties: ${validDateShowAs.join(", ")}`;
    }
  }

  // Check status property with status-specific showAs
  if (propertyType === "status") {
    const validStatusShowAs = ["option", "group"];
    if (!validStatusShowAs.includes(showAs)) {
      return `Property "${propertyKey}" is type 'status' and cannot use showAs: '${showAs}'. Valid options for status properties: ${validStatusShowAs.join(", ")}`;
    }
  }

  // Check other properties don't use date/status showAs
  if (propertyType !== "date" && propertyType !== "status") {
    const dateOrStatusShowAs = [
      "day",
      "week",
      "month",
      "year",
      "relative",
      "option",
      "group",
    ];
    if (dateOrStatusShowAs.includes(showAs)) {
      return `Property "${propertyKey}" is type '${propertyType}' and cannot use showAs: '${showAs}'. This showAs option is only for date or status properties.`;
    }
  }

  return null;
}

/**
 * Validates donut chart configuration
 */
function validateDonutChart<TData>(
  config: ChartViewProps<TData>["config"],
  properties: readonly DataViewProperty<TData>[]
): string | null {
  if (!config.data?.whatToShow?.property) {
    return "Donut chart requires data.whatToShow.property configuration";
  }

  const property = properties.find(
    (p) => p.id === config.data?.whatToShow?.property
  );
  if (!property) {
    return `Property "${String(config.data?.whatToShow?.property)}" not found`;
  }

  // Validate showAs based on property type
  const whatToShow = config.data.whatToShow;
  if ("showAs" in whatToShow) {
    const error = validateShowAs(
      property.type,
      String(whatToShow.property),
      whatToShow.showAs
    );
    if (error) {
      return error;
    }
  }

  if (config.data.showAs !== "count" && !config.data.computeProperty) {
    return `Computation "${config.data.showAs}" requires computeProperty`;
  }

  return null;
}

/**
 * Validates horizontal bar chart configuration
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex validation logic for chart configuration
function validateHorizontalBarChart<TData>(
  config: ChartViewProps<TData>["config"],
  properties: readonly DataViewProperty<TData>[]
): string | null {
  // For horizontal: xAxis = values, yAxis = categories
  if (!config.yAxis?.whatToShow) {
    return "Horizontal bar chart requires yAxis.whatToShow configuration";
  }

  const yAxisWhatToShow = config.yAxis.whatToShow;
  if (typeof yAxisWhatToShow === "object" && "property" in yAxisWhatToShow) {
    const yProperty = properties.find((p) => p.id === yAxisWhatToShow.property);
    if (!yProperty) {
      return `Property "${String(yAxisWhatToShow.property)}" not found`;
    }

    // Validate showAs for yAxis
    if ("showAs" in yAxisWhatToShow) {
      const error = validateShowAs(
        yProperty.type,
        String(yAxisWhatToShow.property),
        yAxisWhatToShow.showAs
      );
      if (error) {
        return error;
      }
    }

    // Validate groupBy if present
    if (config.xAxis?.groupBy && config.xAxis) {
      const groupByProperty = properties.find(
        (p) => p.id === config.xAxis?.groupBy?.property
      );
      if (groupByProperty && "showAs" in config.xAxis.groupBy) {
        const error = validateShowAs(
          groupByProperty.type,
          String(config.xAxis.groupBy.property),
          config.xAxis.groupBy.showAs
        );
        if (error) {
          return error;
        }
      }
    }
  } else {
    return "Horizontal bar chart requires yAxis.whatToShow.property (categories)";
  }

  if (!config.xAxis?.whatToShow) {
    return "Horizontal bar chart requires xAxis.whatToShow configuration";
  }

  // Check if xAxis.whatToShow is an object with property (not 'count')
  const xAxisWhatToShow = config.xAxis.whatToShow;
  if (
    typeof xAxisWhatToShow === "object" &&
    "property" in xAxisWhatToShow &&
    "showAs" in xAxisWhatToShow
  ) {
    const xProperty = properties.find((p) => p.id === xAxisWhatToShow.property);
    if (!xProperty) {
      return `Property "${String(xAxisWhatToShow.property)}" not found`;
    }
    if (xProperty.type !== "number") {
      return `Property "${String(xAxisWhatToShow.property)}" must be of type number for aggregation`;
    }
  }

  return null;
}

/**
 * Validates vertical bar and line chart configuration
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex validation logic for chart configuration
function validateVerticalChart<TData>(
  config: ChartViewProps<TData>["config"],
  properties: readonly DataViewProperty<TData>[]
): string | null {
  const xAxisWhatToShow = config.xAxis?.whatToShow;
  if (
    !xAxisWhatToShow ||
    typeof xAxisWhatToShow !== "object" ||
    !("property" in xAxisWhatToShow)
  ) {
    return "Vertical bar and line charts require xAxis.whatToShow.property configuration";
  }

  const xProperty = properties.find((p) => p.id === xAxisWhatToShow.property);
  if (!xProperty) {
    return `Property "${String(xAxisWhatToShow.property)}" not found`;
  }

  // Validate showAs for xAxis
  if ("showAs" in xAxisWhatToShow) {
    const error = validateShowAs(
      xProperty.type,
      String(xAxisWhatToShow.property),
      xAxisWhatToShow.showAs
    );
    if (error) {
      return error;
    }
  }

  // Validate groupBy if present
  if (config.yAxis?.groupBy && config.yAxis) {
    const groupByProperty = properties.find(
      (p) => p.id === config.yAxis?.groupBy?.property
    );
    if (groupByProperty && "showAs" in config.yAxis.groupBy) {
      const error = validateShowAs(
        groupByProperty.type,
        String(config.yAxis.groupBy.property),
        config.yAxis.groupBy.showAs
      );
      if (error) {
        return error;
      }
    }
  }

  if (!config.yAxis?.whatToShow) {
    return "Vertical bar and line charts require yAxis.whatToShow configuration";
  }

  // Check if yAxis.whatToShow is an object (not 'count')
  const yAxisWhatToShow = config.yAxis.whatToShow;
  if (typeof yAxisWhatToShow === "object" && "property" in yAxisWhatToShow) {
    const yProperty = properties.find((p) => p.id === yAxisWhatToShow.property);
    if (!yProperty) {
      return `Property "${String(yAxisWhatToShow.property)}" not found`;
    }
    if (yProperty.type !== "number") {
      return `Property "${String(yAxisWhatToShow.property)}" must be of type number for aggregation`;
    }
  }

  return null;
}

/**
 * Validates chart configuration based on chart type
 * @param chartType - Type of chart to validate
 * @param config - Chart configuration
 * @param properties - Available properties
 * @returns Error message if invalid, null if valid
 */
export function validateChartConfig<TData>(
  chartType: "verticalBar" | "horizontalBar" | "line" | "area" | "donut",
  config: ChartViewProps<TData>["config"],
  properties: readonly DataViewProperty<TData>[]
): string | null {
  if (chartType === "donut") {
    return validateDonutChart(config, properties);
  }

  if (chartType === "horizontalBar") {
    return validateHorizontalBarChart(config, properties);
  }

  // Vertical bar, line, and area charts use same validation
  return validateVerticalChart(config, properties);
}
