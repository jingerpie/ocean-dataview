import type { GroupByConfig } from "../../types/group-types";

export interface ParsedGroupConfig {
  property: string;
  propertyType:
    | "date"
    | "status"
    | "select"
    | "multiSelect"
    | "checkbox"
    | "text"
    | "number";
  showAs?: "day" | "week" | "month" | "year" | "relative" | "group" | "option";
  startWeekOn?: "monday" | "sunday";
}

/**
 * Extracts property, type, and options from discriminated union config
 */
export function parseGroupByConfig(config: GroupByConfig): ParsedGroupConfig {
  if ("byDate" in config) {
    return {
      property: config.byDate.property,
      propertyType: "date",
      showAs: config.byDate.showAs,
      startWeekOn: config.byDate.startWeekOn,
    };
  }
  if ("byStatus" in config) {
    return {
      property: config.byStatus.property,
      propertyType: "status",
      showAs: config.byStatus.showAs,
    };
  }
  if ("bySelect" in config) {
    return {
      property: config.bySelect.property,
      propertyType: "select",
    };
  }
  if ("byMultiSelect" in config) {
    return {
      property: config.byMultiSelect.property,
      propertyType: "multiSelect",
    };
  }
  if ("byCheckbox" in config) {
    return {
      property: config.byCheckbox.property,
      propertyType: "checkbox",
    };
  }
  if ("byText" in config) {
    return {
      property: config.byText.property,
      propertyType: "text",
      // Note: text showAs (exact/alphabetical) is a future feature, not passed to grouping
    };
  }
  if ("byNumber" in config) {
    return {
      property: config.byNumber.property,
      propertyType: "number",
      // showAs for number is an object, handle separately if needed
    };
  }
  throw new Error("Invalid group config: no recognized byXXX key found");
}
