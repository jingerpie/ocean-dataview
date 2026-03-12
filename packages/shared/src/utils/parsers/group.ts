import { createParser } from "nuqs/server";
import type {
  DateShowAs,
  GroupablePropertyType,
  GroupByConfig,
  GroupConfigInput,
  StatusShowAs,
  TextShowAs,
  WeekStartDay,
} from "../../types/group-config";
import { decodeTupleStrings } from "../url-dsl/decoder";
import { encodeTuple } from "../url-dsl/encoder";

// Re-export types for convenience (canonical types are in @sparkyidea/shared/types)
export type { GroupByConfig, GroupConfigInput } from "../../types/group-config";

// ============================================================================
// URL Type Mappings
// ============================================================================

/**
 * Map URL type strings to canonical propertyType values.
 * Note: URL uses "multiselect" (lowercase), canonical uses "multiSelect" (camelCase)
 */
const URL_TO_PROPERTY_TYPE: Record<string, GroupablePropertyType> = {
  select: "select",
  status: "status",
  date: "date",
  checkbox: "checkbox",
  multiselect: "multiSelect",
  text: "text",
  number: "number",
};

/**
 * Map canonical propertyType to URL type string.
 */
const PROPERTY_TYPE_TO_URL: Record<GroupablePropertyType, string> = {
  select: "select",
  status: "status",
  date: "date",
  checkbox: "checkbox",
  multiSelect: "multiselect",
  text: "text",
  number: "number",
};

type UrlType = keyof typeof URL_TO_PROPERTY_TYPE;

// ============================================================================
// Validation Sets
// ============================================================================

const DATE_SHOW_AS = new Set<string>([
  "day",
  "week",
  "month",
  "year",
  "relative",
]);
const STATUS_SHOW_AS = new Set<string>(["option", "group"]);
const TEXT_SHOW_AS = new Set<string>(["exact", "alphabetical"]);
const WEEK_START = new Set<string>(["monday", "sunday"]);

// ============================================================================
// Encoder
// ============================================================================

/**
 * Encode group config to DSL format with comma-separated groups.
 *
 * Format: type.property,showAs,sort,hideEmpty
 *
 * Examples:
 *   select.status                   ← all defaults
 *   select.status,,desc             ← sort desc
 *   date.created,day                ← showAs=day
 *   date.created,day.monday         ← showAs=day, startWeekOn=monday
 *   number.price,0.100.10,desc      ← showAs with range
 */
export function encodeGroup(config: GroupConfigInput): string {
  const urlType = PROPERTY_TYPE_TO_URL[config.propertyType];
  if (!urlType) {
    return "";
  }

  let showAsParts: (string | number)[] = [];

  // biome-ignore lint/style/useDefaultSwitchClause: All property types are handled exhaustively
  switch (config.propertyType) {
    case "date":
      showAsParts = config.startWeekOn
        ? [config.showAs, config.startWeekOn]
        : [config.showAs];
      break;

    case "status":
      if (config.showAs) {
        showAsParts = [config.showAs];
      }
      break;

    case "text":
      if (config.showAs) {
        showAsParts = [config.showAs];
      }
      break;

    case "number":
      if (config.numberRange) {
        const { range, step } = config.numberRange;
        showAsParts = [range[0], range[1], step];
      }
      break;

    case "select":
    case "multiSelect":
    case "checkbox":
      // No showAs for these types
      break;
  }

  // Build comma-separated groups: type.property,showAs,sort,hideEmpty
  const groups = [
    encodeTuple([urlType, config.propertyId]),
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
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Parser handles multiple property types with different validation rules
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

  const urlType = typeParts[0];
  if (!(urlType && urlType in URL_TO_PROPERTY_TYPE)) {
    return null;
  }

  const propertyType = URL_TO_PROPERTY_TYPE[urlType as UrlType];
  const propertyId = typeParts[1];
  if (!propertyId) {
    return null;
  }

  // Group 1: showAs (type-specific)
  const showAsParts = decodeTupleStrings(groups[1] ?? "");

  // Group 2: sort
  const sort = parseSort(groups[2] ?? "");

  // Group 3: hideEmpty
  const hideEmpty = (groups[3] ?? "") === "true";

  // Build base options
  const options = {
    ...(sort && { sort }),
    ...(hideEmpty && { hideEmpty }),
  };

  // Parse type-specific config
  let result: GroupByConfig;

  switch (propertyType) {
    case "select":
      result = { propertyType: "select", propertyId };
      break;

    case "checkbox":
      result = { propertyType: "checkbox", propertyId };
      break;

    case "multiSelect":
      result = { propertyType: "multiSelect", propertyId };
      break;

    case "status": {
      const showAs = showAsParts[0] as StatusShowAs | undefined;
      if (showAs && !STATUS_SHOW_AS.has(showAs)) {
        return null;
      }
      result = showAs
        ? { propertyType: "status", propertyId, showAs }
        : { propertyType: "status", propertyId };
      break;
    }

    case "text": {
      const showAs = showAsParts[0] as TextShowAs | undefined;
      if (showAs && !TEXT_SHOW_AS.has(showAs)) {
        return null;
      }
      result = showAs
        ? { propertyType: "text", propertyId, showAs }
        : { propertyType: "text", propertyId };
      break;
    }

    case "date": {
      const showAs = showAsParts[0] as DateShowAs;
      if (!DATE_SHOW_AS.has(showAs)) {
        return null;
      }
      const startWeekOn = showAsParts[1] as WeekStartDay | undefined;
      if (startWeekOn && !WEEK_START.has(startWeekOn)) {
        result = { propertyType: "date", propertyId, showAs };
      } else {
        result = startWeekOn
          ? { propertyType: "date", propertyId, showAs, startWeekOn }
          : { propertyType: "date", propertyId, showAs };
      }
      break;
    }

    case "number": {
      if (showAsParts.length >= 3) {
        const min = Number(showAsParts[0]);
        const max = Number(showAsParts[1]);
        const step = Number(showAsParts[2]);
        if (Number.isNaN(min) || Number.isNaN(max) || Number.isNaN(step)) {
          result = { propertyType: "number", propertyId };
        } else {
          result = {
            propertyType: "number",
            propertyId,
            numberRange: { range: [min, max], step },
          };
        }
      } else {
        result = { propertyType: "number", propertyId };
      }
      break;
    }

    default:
      return null;
  }

  return { ...result, ...options };
}

// ============================================================================
// Parsers
// ============================================================================

/** Server-side parser for group config (no validation) */
export const groupServerParser = createParser({
  parse: decodeGroup,
  serialize: encodeGroup,
});

/** Client-side parser for group config (no validation) */
export const parseAsGroupBy = createParser({
  parse: decodeGroup,
  serialize: encodeGroup,
});
