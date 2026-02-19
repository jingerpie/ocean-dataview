"use client";

import { Loader2 } from "lucide-react";
import { useRef } from "react";
import type { DataViewProperty, NumberConfig } from "../../types";
import { DataCell } from "../views/data-cell";
import { StickyGroupLabel } from "../views/sticky-group-label";
import { AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

// Regex patterns for parsing number range group keys
const LESS_THAN_REGEX = /^< (\d+)$/;
const PLUS_REGEX = /^(\d+)\+$/;
const RANGE_REGEX = /^(\d+)-(\d+)$/;

/**
 * Format a single number using NumberConfig settings
 */
function formatNumber(value: number, config?: NumberConfig): string {
  const { numberFormat = "number", decimalPlaces = 0 } = config ?? {};

  switch (numberFormat) {
    case "numberWithCommas":
      return value.toLocaleString(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      });
    case "percentage":
      return `${value.toFixed(decimalPlaces)}%`;
    case "dollar":
      return `$${value.toLocaleString(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })}`;
    case "euro":
      return `€${value.toLocaleString(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })}`;
    case "pound":
      return `£${value.toLocaleString(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })}`;
    default:
      return value.toFixed(decimalPlaces);
  }
}

/**
 * Format a number range group key (e.g., "0-100") into a display label
 * Returns null if the key is not a valid range format
 */
function formatNumberRangeLabel(
  groupKey: string,
  config?: NumberConfig
): string | null {
  // Handle special cases
  if (groupKey === "Unknown") {
    return "Unknown";
  }

  // Handle "< min" format
  const lessThanMatch = LESS_THAN_REGEX.exec(groupKey);
  if (lessThanMatch) {
    const min = Number(lessThanMatch[1]);
    return `< ${formatNumber(min, config)}`;
  }

  // Handle "max+" format
  const plusMatch = PLUS_REGEX.exec(groupKey);
  if (plusMatch) {
    const max = Number(plusMatch[1]);
    return `${formatNumber(max, config)}+`;
  }

  // Handle "min-max" range format
  const rangeMatch = RANGE_REGEX.exec(groupKey);
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    return `${formatNumber(min, config)} to ${formatNumber(max, config)}`;
  }

  return null;
}

interface GroupSectionProps<TData> {
  /**
   * Render function for the group content
   * Receives the group items and should return the view-specific rendering
   */
  children: React.ReactNode;
  /**
   * Group data with items
   */
  group: {
    key: string;
    items: TData[];
    count: number;
    displayCount?: string; // "99+" or actual count as string
    sortValue?: string | number;
  };

  /**
   * GroupBy property definition for styling the group header
   */
  groupByPropertyDef?: DataViewProperty<TData>;

  /**
   * Show loading spinner in the group content area
   */
  isLoading?: boolean;

  /**
   * Optional footer to render at the bottom of the group (e.g., LoadMore button)
   */
  renderFooter?: React.ReactNode;

  /**
   * Display aggregation counts in group headers (default: true)
   */
  showAggregation?: boolean;

  /**
   * Sticky header configuration
   */
  stickyHeader?: {
    /** Enable sticky header behavior */
    enabled: boolean;
    /** Offset from top of viewport (e.g., navbar height) */
    offset?: number;
  };
}

/**
 * GroupSection - Reusable group component for all view types
 * Renders a collapsible group header with the group content
 * Uses DataCell for consistent styling across all property types
 */
export function GroupSection<TData>({
  group,
  groupByPropertyDef,
  children,
  renderFooter,
  isLoading = false,
  showAggregation = true,
  stickyHeader,
}: GroupSectionProps<TData>) {
  const itemRef = useRef<HTMLDivElement>(null);

  // For date properties in group headers, use "relativeGroup" format
  // which converts bucket start dates to labels (e.g., "Today", "Last 7 days", "Aug 2025")
  const dateConfigOverride =
    groupByPropertyDef?.type === "date"
      ? { dateFormat: "relativeGroup" }
      : undefined;

  // For checkbox groups, convert string "Checked"/"Unchecked" to boolean
  // since CheckboxProperty expects boolean, not string
  const getGroupValue = () => {
    if (groupByPropertyDef?.type === "checkbox") {
      return group.key === "Checked";
    }
    return group.key;
  };

  // Render the group label based on property type
  const renderGroupLabel = () => {
    // For number properties, format the range string (e.g., "0-100" → "$0.00 to $100.00")
    if (groupByPropertyDef?.type === "number") {
      const rangeLabel = formatNumberRangeLabel(
        group.key,
        groupByPropertyDef.config
      );
      if (rangeLabel) {
        return <span className="text-sm tabular-nums">{rangeLabel}</span>;
      }
    }

    // Use DataCell for property types (select, multiSelect, status, date, checkbox, etc.)
    if (groupByPropertyDef) {
      return (
        <DataCell
          configOverride={dateConfigOverride}
          item={
            group.items[0] ?? ({ [groupByPropertyDef.id]: group.key } as TData)
          }
          property={groupByPropertyDef}
          value={getGroupValue()}
        />
      );
    }

    // Fallback for no property definition
    return <span className="font-medium text-sm">{group.key}</span>;
  };

  const triggerContent = (
    <AccordionTrigger className="py-3 hover:no-underline">
      <div className="flex items-center gap-2">
        {renderGroupLabel()}
        {showAggregation && (
          <span className="font-medium text-muted-foreground text-xs">
            {group.displayCount ?? group.count}
          </span>
        )}
      </div>
    </AccordionTrigger>
  );

  return (
    <AccordionItem ref={itemRef} value={group.key}>
      {stickyHeader?.enabled ? (
        <StickyGroupLabel
          containerRef={itemRef}
          offset={stickyHeader.offset ?? 57}
        >
          {triggerContent}
        </StickyGroupLabel>
      ) : (
        triggerContent
      )}
      <AccordionContent>
        {isLoading && group.items.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {children}
            {renderFooter && <div className="pt-4">{renderFooter}</div>}
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
