"use client";

import { Loader2 } from "lucide-react";
import { useRef } from "react";
import type { DataViewProperty } from "../../types";
import { DataCell } from "../views/data-cell";
import { StickyGroupLabel } from "../views/sticky-group-label";
import { AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

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

  const triggerContent = (
    <AccordionTrigger className="py-3 hover:no-underline">
      <div className="flex items-center gap-2">
        {groupByPropertyDef ? (
          <DataCell
            configOverride={dateConfigOverride}
            item={
              group.items[0] ??
              ({ [groupByPropertyDef.id]: group.key } as TData)
            }
            property={groupByPropertyDef}
            value={getGroupValue()}
          />
        ) : (
          <span className="font-medium text-sm">{group.key}</span>
        )}
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
