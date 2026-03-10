import { createParser } from "nuqs/server";
import { decodeTupleStrings } from "../url-dsl/decoder";
import { encodeTuple } from "../url-dsl/encoder";

// ============================================================================
// Types
// ============================================================================

/**
 * GroupBy URL format (DSL) - Comma-separated groups:
 *
 * Format: type.property,showAs,sort,hideEmpty
 *
 * - Comma separates logical groups
 * - Dots within each group for sub-params
 * - Empty group (,,) means use default
 * - Trailing empties can be omitted
 *
 * Examples:
 *   select.status                   ← all defaults
 *   select.status,,desc             ← sort desc
 *   select.status,,,true            ← hideEmpty
 *   date.created,day                ← showAs=day
 *   date.created,day.monday         ← showAs=day, startWeekOn=monday
 *   date.created,day,desc,true      ← full config
 *   number.price,0.100.10,desc      ← showAs with range
 *   text.email,exact,,true          ← showAs=exact, hideEmpty
 */
export type GroupByConfigInput =
  | { bySelect: { property: string } }
  | { byStatus: { property: string; showAs?: "option" | "group" } }
  | {
      byDate: {
        property: string;
        showAs: "day" | "week" | "month" | "year" | "relative";
        startWeekOn?: "monday" | "sunday";
      };
    }
  | { byCheckbox: { property: string } }
  | { byMultiSelect: { property: string } }
  | { byText: { property: string; showAs?: "exact" | "alphabetical" } }
  | {
      byNumber: {
        property: string;
        showAs?: { range: [number, number]; step: number };
      };
    };

/**
 * Group configuration with settings.
 */
export type GroupConfigInput = GroupByConfigInput & {
  sort?: "asc" | "desc";
  hideEmpty?: boolean;
};

// ============================================================================
// Type Mappings
// ============================================================================

const TYPE_MAP = {
  select: "bySelect",
  status: "byStatus",
  date: "byDate",
  checkbox: "byCheckbox",
  multiselect: "byMultiSelect",
  text: "byText",
  number: "byNumber",
} as const;

type GroupType = keyof typeof TYPE_MAP;

// ============================================================================
// Encoder
// ============================================================================

/**
 * Encode group config to DSL format with comma-separated groups.
 *
 * Format: type.property,showAs,sort,hideEmpty
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: switch cases for each type
export function encodeGroup(config: GroupConfigInput): string {
  let type: GroupType | null = null;
  let property = "";
  let showAsParts: (string | number)[] = [];

  if ("bySelect" in config) {
    type = "select";
    property = config.bySelect.property;
  } else if ("byStatus" in config) {
    type = "status";
    property = config.byStatus.property;
    showAsParts = config.byStatus.showAs ? [config.byStatus.showAs] : [];
  } else if ("byDate" in config) {
    type = "date";
    property = config.byDate.property;
    showAsParts = config.byDate.startWeekOn
      ? [config.byDate.showAs, config.byDate.startWeekOn]
      : [config.byDate.showAs];
  } else if ("byCheckbox" in config) {
    type = "checkbox";
    property = config.byCheckbox.property;
  } else if ("byMultiSelect" in config) {
    type = "multiselect";
    property = config.byMultiSelect.property;
  } else if ("byText" in config) {
    type = "text";
    property = config.byText.property;
    if (config.byText.showAs) {
      showAsParts = [config.byText.showAs];
    }
  } else if ("byNumber" in config) {
    type = "number";
    property = config.byNumber.property;
    if (config.byNumber.showAs) {
      const { range, step } = config.byNumber.showAs;
      showAsParts = [range[0], range[1], step];
    }
  }

  if (!type) {
    return "";
  }

  // Build comma-separated groups: type.property,showAs,sort,hideEmpty
  const groups = [
    encodeTuple([type, property]),
    showAsParts.length > 0 ? encodeTuple(showAsParts) : "",
    config.sort === "desc" ? "desc" : "",
    config.hideEmpty ? "true" : "",
  ];

  // Trim trailing empty groups
  while (groups.length > 1 && groups.at(-1) === "") {
    groups.pop();
  }

  return groups.join(",");
}

// ============================================================================
// Decoder
// ============================================================================

type DateShowAs = "day" | "week" | "month" | "year" | "relative";
type TextShowAs = "exact" | "alphabetical";
type StatusShowAs = "option" | "group";
type WeekStart = "monday" | "sunday";

const DATE_SHOW_AS = new Set(["day", "week", "month", "year", "relative"]);

function parseSort(val: string): "asc" | "desc" | undefined {
  if (val === "desc") {
    return "desc";
  }
  if (val === "asc") {
    return "asc";
  }
  return undefined;
}

/**
 * Decode DSL format to group config using comma-separated groups.
 *
 * Format: type.property,showAs,sort,hideEmpty
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: switch cases for each type
export function decodeGroup(value: string): GroupConfigInput | null {
  if (!value) {
    return null;
  }

  // Split by comma into groups
  const groups = value.split(",");

  // Group 0: type.property
  const typeParts = decodeTupleStrings(groups[0] ?? "");
  if (typeParts.length < 2) {
    return null;
  }

  const typeStr = typeParts[0];
  if (!(typeStr && typeStr in TYPE_MAP)) {
    return null;
  }

  const type = typeStr as GroupType;
  const property = typeParts[1];
  if (!property) {
    return null;
  }

  // Group 1: showAs (type-specific)
  const showAsParts = decodeTupleStrings(groups[1] ?? "");

  // Group 2: sort
  const sort = parseSort(groups[2] ?? "");

  // Group 3: hideEmpty
  const hideEmpty = (groups[3] ?? "") === "true";

  // Parse type-specific config
  let result: GroupByConfigInput | null = null;

  switch (type) {
    case "select":
      result = { bySelect: { property } };
      break;

    case "checkbox":
      result = { byCheckbox: { property } };
      break;

    case "multiselect":
      result = { byMultiSelect: { property } };
      break;

    case "status": {
      const showAs = (showAsParts[0] || undefined) as StatusShowAs | undefined;
      if (showAs && showAs !== "option" && showAs !== "group") {
        return null;
      }
      result = showAs
        ? { byStatus: { property, showAs } }
        : { byStatus: { property } };
      break;
    }

    case "text": {
      const showAs = (showAsParts[0] || undefined) as TextShowAs | undefined;
      if (showAs && showAs !== "exact" && showAs !== "alphabetical") {
        return null;
      }
      result = showAs
        ? { byText: { property, showAs } }
        : { byText: { property } };
      break;
    }

    case "date": {
      const showAs = showAsParts[0] as DateShowAs;
      if (!DATE_SHOW_AS.has(showAs)) {
        return null;
      }
      const startWeekOn = (showAsParts[1] || undefined) as
        | WeekStart
        | undefined;
      const dateConfig: {
        property: string;
        showAs: DateShowAs;
        startWeekOn?: WeekStart;
      } = {
        property,
        showAs,
      };
      if (startWeekOn === "monday" || startWeekOn === "sunday") {
        dateConfig.startWeekOn = startWeekOn;
      }
      result = { byDate: dateConfig };
      break;
    }

    case "number": {
      if (showAsParts.length >= 3) {
        const min = Number(showAsParts[0]);
        const max = Number(showAsParts[1]);
        const step = Number(showAsParts[2]);
        if (Number.isNaN(min) || Number.isNaN(max) || Number.isNaN(step)) {
          result = { byNumber: { property } };
        } else {
          result = {
            byNumber: { property, showAs: { range: [min, max], step } },
          };
        }
      } else {
        result = { byNumber: { property } };
      }
      break;
    }

    default:
      return null;
  }

  if (!result) {
    return null;
  }

  return {
    ...result,
    ...(sort && { sort }),
    ...(hideEmpty && { hideEmpty }),
  };
}

// ============================================================================
// Parsers
// ============================================================================

/** Server-side parser for group config */
export const groupServerParser = createParser({
  parse: decodeGroup,
  serialize: encodeGroup,
});

/** Client-side parser for group config */
export const parseAsGroupBy = createParser({
  parse: decodeGroup,
  serialize: encodeGroup,
});
