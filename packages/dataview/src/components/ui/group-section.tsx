"use client";

import { useRef } from "react";
import { useGroupParams } from "../../hooks/use-group-params";
import type { DataViewProperty, NumberConfig } from "../../types/property.type";
import { DataCell } from "../views/data-cell";
import { StickyGroupLabel } from "../views/sticky-group-label";
import { AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

/**
 * Get the showAs value from a date group config
 */
function getDateGroupShowAs(
  group: ReturnType<typeof useGroupParams>["group"]
): string | null {
  if (!group || group.propertyType !== "date") {
    return null;
  }
  return group.showAs;
}

/**
 * Format a date group key based on the showAs setting.
 * - day: "Aug 2, 2025"
 * - week: "Jul 27 - Aug 2, 2025"
 * - month: "Aug 2025"
 * - year: "2025"
 *
 * Returns null if the groupKey can't be parsed as a date.
 */
function formatDateGroupLabel(
  groupKey: string,
  showAs: string | null
): string | null {
  // Handle special cases
  if (groupKey === "Unknown" || groupKey === "No Date") {
    return groupKey;
  }

  // Try to parse the group key as a date
  const date = new Date(groupKey);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const monthShort = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();

  switch (showAs) {
    case "day":
      // "Aug 2, 2025"
      return `${monthShort} ${day}, ${year}`;

    case "week": {
      // "Jul 27 - Aug 2, 2025"
      // The group key is the start of the week, calculate end (6 days later)
      const weekEnd = new Date(date);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const startMonth = monthShort;
      const startDay = day;
      const endMonth = weekEnd.toLocaleString("en-US", { month: "short" });
      const endDay = weekEnd.getDate();
      const endYear = weekEnd.getFullYear();

      // If same month, just show "Aug 2-8, 2025"
      if (startMonth === endMonth && year === endYear) {
        return `${startMonth} ${startDay}-${endDay}, ${year}`;
      }
      // If different months but same year, show "Jul 27 - Aug 2, 2025"
      if (year === endYear) {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
      }
      // If different years, show "Dec 29, 2024 - Jan 4, 2025"
      return `${startMonth} ${startDay}, ${year} - ${endMonth} ${endDay}, ${endYear}`;
    }

    case "month":
      // "Aug 2025"
      return `${monthShort} ${year}`;

    case "year":
      // "2025"
      return String(year);

    default:
      return null;
  }
}

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
   * GroupBy property schema for styling the group header
   */
  groupByPropertyDef?: DataViewProperty<TData>;

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
    /** Sticky axis: "vertical" (page scroll) or "horizontal" (inside overflow-x-auto) */
    axis?: "vertical" | "horizontal";
    /** Enable sticky header behavior */
    enabled: boolean;
    /** Offset from top of viewport (only used for vertical axis) */
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
  showAggregation = true,
  stickyHeader,
}: GroupSectionProps<TData>) {
  const itemRef = useRef<HTMLDivElement>(null);
  const { group: groupConfig } = useGroupParams();

  // Get the date showAs setting from group config
  const dateShowAs = getDateGroupShowAs(groupConfig);

  // For date properties with "relative" showAs, use "relativeGroup" format
  // which converts bucket start timestamps to labels (e.g., "Today", "Last 7 days", "Aug 2025")
  // For other date showAs values (day/week/month/year), the server returns pre-formatted strings
  // so we display them as-is without parsing
  const dateConfigOverride =
    groupByPropertyDef?.type === "date" && dateShowAs === "relative"
      ? { dateFormat: "relativeGroup" }
      : undefined;

  // For checkbox groups, convert "true"/"false" string to boolean for DataCell
  // "Checked"/"Unchecked" labels are rendered by CheckboxProperty
  const getGroupValue = () => {
    if (groupByPropertyDef?.type === "checkbox") {
      return group.key === "true";
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

    // For date properties with day/week/month/year showAs, format the label directly
    // (relative showAs uses DataCell with relativeGroup format)
    if (
      groupByPropertyDef?.type === "date" &&
      dateShowAs &&
      dateShowAs !== "relative"
    ) {
      const dateLabel = formatDateGroupLabel(group.key, dateShowAs);
      if (dateLabel) {
        return <span className="font-medium text-sm">{dateLabel}</span>;
      }
    }

    // For email and phone properties, render as plain text (not clickable links)
    if (
      groupByPropertyDef?.type === "email" ||
      groupByPropertyDef?.type === "phone"
    ) {
      return <span className="text-sm">{group.key || "-"}</span>;
    }

    // Use DataCell for property types (select, multiSelect, status, date/relative, checkbox, etc.)
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

    // Fallback for no property schema
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
          axis={stickyHeader.axis}
          containerRef={itemRef}
          offset={stickyHeader.offset}
        >
          {triggerContent}
        </StickyGroupLabel>
      ) : (
        triggerContent
      )}
      <AccordionContent>
        {children}
        {renderFooter}
      </AccordionContent>
    </AccordionItem>
  );
}
