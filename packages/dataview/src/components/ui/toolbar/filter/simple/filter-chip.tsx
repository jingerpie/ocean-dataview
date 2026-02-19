"use client";

import type { WhereRule } from "@sparkyidea/shared/types";
import type { PropertyMeta } from "../../../../../types";
import { CheckboxSimpleFilter } from "../filters/checkbox-filter";
import { DateSimpleFilter } from "../filters/date-filter";
import { SelectSimpleFilter } from "../filters/select-filter";
import { StatusSimpleFilter } from "../filters/status-filter";
import { TextSimpleFilter } from "../filters/text-filter";

interface FilterChipProps {
  /** Callback to add this filter to advanced filter */
  onAddToAdvanced?: () => void;
  /** Callback to remove this filter */
  onRemove: () => void;
  /** Callback when rule changes */
  onRuleChange: (rule: WhereRule) => void;
  /** The property being filtered */
  property: PropertyMeta;
  /** The filter rule */
  rule: WhereRule;
  /**
   * Chip variant:
   * - `compact` - Shows property name only: [Icon] Property ▾
   * - `detailed` - Shows property + preview: [Icon] Property: Preview ▾
   * @default "compact"
   */
  variant?: "compact" | "detailed";
}

/**
 * Simple filter chip with inline editor popover.
 * Dispatches to the appropriate filter component based on property type.
 *
 * Variants:
 * - `compact`: [◉ Property ▾]
 * - `detailed`: [◉ Property: Preview ▾] (max-width: w-58, truncates)
 */
function FilterChip(props: FilterChipProps) {
  const { property } = props;

  switch (property.type) {
    case "select":
    case "multiSelect":
      return <SelectSimpleFilter {...props} />;

    case "status":
      return <StatusSimpleFilter {...props} />;

    case "text":
    case "url":
    case "email":
    case "phone":
    case "number":
      return <TextSimpleFilter {...props} />;

    case "checkbox":
      return <CheckboxSimpleFilter {...props} />;

    case "date":
      return <DateSimpleFilter {...props} />;

    case "filesMedia":
    case "formula":
      // Only support isEmpty/isNotEmpty - use text filter for the chip UI
      return <TextSimpleFilter {...props} />;

    default:
      return null;
  }
}

export { FilterChip };
export type { FilterChipProps };
