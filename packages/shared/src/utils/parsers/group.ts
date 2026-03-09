import { createParser } from "nuqs/server";
import { decodeOptions, decodeTupleStrings } from "../url-dsl/decoder";
import { encodeOptions, encodeTuple } from "../url-dsl/encoder";

// ============================================================================
// Types
// ============================================================================

/**
 * GroupBy URL format (DSL):
 *   select.property
 *   status.property.showAs
 *   date.property.showAs[.startWeekOn]
 *   checkbox.property
 *   multiselect.property
 *   text.property[.showAs]
 *   number.property.min.max.step
 *
 * With options:
 *   multiselect.tags:sort:desc:hideEmpty
 */
export type GroupByConfigInput =
  | { bySelect: { property: string } }
  | { byStatus: { property: string; showAs: "option" | "group" } }
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
 * Encode group config to DSL format.
 * Example: { byMultiSelect: { property: "tags" }, sort: "desc" } → "multiselect.tags.desc"
 * Sort is appended to the tuple, hideEmpty remains as option.
 */
export function encodeGroup(config: GroupConfigInput): string {
  let type: GroupType | null = null;
  let parts: (string | number)[] = [];

  if ("bySelect" in config) {
    type = "select";
    parts = [config.bySelect.property];
  } else if ("byStatus" in config) {
    type = "status";
    parts = [config.byStatus.property, config.byStatus.showAs];
  } else if ("byDate" in config) {
    type = "date";
    parts = [config.byDate.property, config.byDate.showAs];
    if (config.byDate.startWeekOn) {
      parts.push(config.byDate.startWeekOn);
    }
  } else if ("byCheckbox" in config) {
    type = "checkbox";
    parts = [config.byCheckbox.property];
  } else if ("byMultiSelect" in config) {
    type = "multiselect";
    parts = [config.byMultiSelect.property];
  } else if ("byText" in config) {
    type = "text";
    parts = [config.byText.property];
    if (config.byText.showAs) {
      parts.push(config.byText.showAs);
    }
  } else if ("byNumber" in config) {
    type = "number";
    parts = [config.byNumber.property];
    if (config.byNumber.showAs) {
      const { range, step } = config.byNumber.showAs;
      parts.push(range[0], range[1], step);
    }
  }

  if (!type) {
    return "";
  }

  // Append sort direction only if desc (asc is the default)
  if (config.sort === "desc") {
    parts.push(config.sort);
  }

  const base = encodeTuple([type, ...parts]);

  // hideEmpty stays as option (display-only, doesn't affect query)
  const options = encodeOptions({
    hideEmpty: config.hideEmpty,
  });

  return base + options;
}

// ============================================================================
// Decoder Helpers
// ============================================================================

type DateShowAs = "day" | "week" | "month" | "year" | "relative";
type TextShowAs = "exact" | "alphabetical";
type StatusShowAs = "option" | "group";
type WeekStart = "monday" | "sunday";

const DATE_SHOW_AS_VALUES: DateShowAs[] = [
  "day",
  "week",
  "month",
  "year",
  "relative",
];

function decodeStatusConfig(
  property: string,
  parts: string[]
): GroupByConfigInput | null {
  const showAs = parts[2] as StatusShowAs | undefined;
  if (showAs !== "option" && showAs !== "group") {
    return null;
  }
  return { byStatus: { property, showAs } };
}

function decodeDateConfig(
  property: string,
  parts: string[]
): GroupByConfigInput | null {
  const showAs = parts[2] as DateShowAs | undefined;
  if (!(showAs && DATE_SHOW_AS_VALUES.includes(showAs))) {
    return null;
  }
  const startWeekOn = parts[3] as WeekStart | undefined;
  const config: {
    property: string;
    showAs: DateShowAs;
    startWeekOn?: WeekStart;
  } = {
    property,
    showAs,
  };
  if (startWeekOn === "monday" || startWeekOn === "sunday") {
    config.startWeekOn = startWeekOn;
  }
  return { byDate: config };
}

function decodeTextConfig(
  property: string,
  parts: string[]
): GroupByConfigInput | null {
  const showAs = parts[2] as TextShowAs | undefined;
  if (showAs && showAs !== "exact" && showAs !== "alphabetical") {
    return null;
  }
  return showAs ? { byText: { property, showAs } } : { byText: { property } };
}

function decodeNumberConfig(
  property: string,
  parts: string[]
): GroupByConfigInput {
  if (parts.length >= 5) {
    const min = Number(parts[2]);
    const max = Number(parts[3]);
    const step = Number(parts[4]);
    if (!(Number.isNaN(min) || Number.isNaN(max) || Number.isNaN(step))) {
      return { byNumber: { property, showAs: { range: [min, max], step } } };
    }
  }
  return { byNumber: { property } };
}

// ============================================================================
// Decoder
// ============================================================================

/**
 * Extract sort direction from the end of parts array if present.
 * Returns the sort direction and the parts array without the sort.
 */
function extractSort(parts: string[]): {
  sort: "asc" | "desc" | undefined;
  partsWithoutSort: string[];
} {
  const lastPart = parts.at(-1);
  if (lastPart === "asc" || lastPart === "desc") {
    return {
      sort: lastPart,
      partsWithoutSort: parts.slice(0, -1),
    };
  }
  return { sort: undefined, partsWithoutSort: parts };
}

/**
 * Decode DSL format to group config.
 * Example: "multiselect.tags.desc" → { byMultiSelect: { property: "tags" }, sort: "desc" }
 * Sort is extracted from the end of the tuple, hideEmpty from options.
 */
export function decodeGroup(value: string): GroupConfigInput | null {
  if (!value) {
    return null;
  }

  // Split base from options
  const colonIndex = value.indexOf(":");
  const base = colonIndex === -1 ? value : value.slice(0, colonIndex);
  const optionsStr = colonIndex === -1 ? "" : value.slice(colonIndex);

  const rawParts = decodeTupleStrings(base);
  if (rawParts.length < 2) {
    return null;
  }

  // Extract sort from the end of parts if present
  const { sort, partsWithoutSort: parts } = extractSort(rawParts);

  const typeStr = parts[0];
  if (!(typeStr && typeStr in TYPE_MAP)) {
    return null;
  }

  const type = typeStr as GroupType;
  const byKey = TYPE_MAP[type];
  const property = parts[1];

  if (!property) {
    return null;
  }

  // Parse the group config based on type
  let result: GroupByConfigInput | null = null;

  switch (byKey) {
    case "bySelect":
      result = { bySelect: { property } };
      break;
    case "byStatus":
      result = decodeStatusConfig(property, parts);
      break;
    case "byDate":
      result = decodeDateConfig(property, parts);
      break;
    case "byCheckbox":
      result = { byCheckbox: { property } };
      break;
    case "byMultiSelect":
      result = { byMultiSelect: { property } };
      break;
    case "byText":
      result = decodeTextConfig(property, parts);
      break;
    case "byNumber":
      result = decodeNumberConfig(property, parts);
      break;
    default:
      return null;
  }

  if (!result) {
    return null;
  }

  // Parse options (hideEmpty only, sort is from tuple)
  const options = decodeOptions(optionsStr);
  const hideEmpty = options.hideEmpty === true;

  return {
    ...result,
    ...(sort && { sort }),
    ...(hideEmpty && { hideEmpty }),
  };
}

// ============================================================================
// Legacy JSON Support (for migration)
// ============================================================================

function isLegacyFormat(value: string): boolean {
  return value.startsWith("{");
}

function decodeLegacyGroup(value: string): GroupConfigInput | null {
  try {
    const parsed = JSON.parse(value);
    return groupConfigValidator(parsed);
  } catch {
    return null;
  }
}

// ============================================================================
// Validator
// ============================================================================

/**
 * Validate GroupConfigInput from parsed value.
 * Structural check only - tRPC validates property names.
 */
export function groupConfigValidator(value: unknown): GroupConfigInput | null {
  if (typeof value === "string") {
    // DSL format or legacy JSON
    if (isLegacyFormat(value)) {
      return decodeLegacyGroup(value);
    }
    return decodeGroup(value);
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const obj = value as Record<string, unknown>;

  const hasValidByKey =
    "bySelect" in obj ||
    "byStatus" in obj ||
    "byDate" in obj ||
    "byCheckbox" in obj ||
    "byMultiSelect" in obj ||
    "byText" in obj ||
    "byNumber" in obj;

  if (!hasValidByKey) {
    return null;
  }

  return value as GroupConfigInput;
}

// ============================================================================
// Parsers
// ============================================================================

/** Server-side parser for group config */
export const groupServerParser = createParser({
  parse: groupConfigValidator,
  serialize: (value: GroupConfigInput) => encodeGroup(value),
});

/** Client-side parser for group config */
export const parseAsGroupBy = createParser({
  parse: (value: string): GroupConfigInput | null =>
    groupConfigValidator(value),
  serialize: (value: GroupConfigInput) => encodeGroup(value),
});
