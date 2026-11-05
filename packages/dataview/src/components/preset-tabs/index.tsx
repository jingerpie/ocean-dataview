"use client";

import { type ReactNode, useEffect, useMemo, useRef } from "react";
import { useFilterParams } from "../../hooks/use-filter-params";
import { useGroupParams } from "../../hooks/use-group-params";
import { useSortParams } from "../../hooks/use-sort-params";
import { cn } from "../../lib/utils";
import { encodeFilter } from "../../parsers/filter";
import type { SortQuery, WhereNode } from "../../types/filter.type";
import type { GroupConfigInput } from "../../types/group.type";
import {
  collectFilterProperties,
  extractPropertiesFromFilter,
  removePropertiesFromFilter,
} from "../../utils/where-filter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

export interface TabOption {
  /**
   * Filter to apply when selected. Only nodes on properties owned by this
   * tab group (referenced by any option's filter) are replaced — other
   * filter rules are preserved. undefined = don't touch the filter (such
   * an option also never derives as active); null = clear the owned
   * properties. Referenced properties must exist in the view's property
   * schema and be filterable, or validation strips the rules right after
   * selection and the tab derives inactive.
   */
  filter?: WhereNode[] | null;
  /** Group config to apply when selected. null = flat (no grouping) */
  group?: GroupConfigInput | null;
  /** Display label for the tab. Also used as the tab value — must be unique. */
  label: string;
  /** Sort to apply when selected. undefined = no change, null = clear */
  sort?: SortQuery[] | null;
}

interface PresetTabsProps {
  /** Accessible name for the tab list (and the mobile select) */
  "aria-label"?: string;
  /** Additional class name for the tabs root */
  className?: string;
  /**
   * Swap the tabs for a Select below the `sm` breakpoint.
   * @default true
   */
  mobileSelect?: boolean;
  /**
   * Fires whenever the derived active option changes — from a tab click,
   * a filter-chip edit, or history navigation.
   */
  onActiveChange?: (label: string | null) => void;
  /** Tab options - first option is typically the unfiltered default */
  options: TabOption[];
  /**
   * Right-aligned content on the tab row (e.g. `<NotionToolbarActions />`).
   * Stays visible at every breakpoint, including when `mobileSelect`
   * swaps the tabs for a Select.
   */
  trailing?: ReactNode;
  /**
   * Visual style: "segmented" pill group or "line" underline row.
   * @default "segmented"
   */
  variant?: "segmented" | "line";
}

/**
 * Preset filter tabs over the dataview filter. Multiple instances can
 * coexist on one view: each instance owns the properties referenced by
 * its options' filters and selecting a tab replaces only the rules on
 * those properties, preserving other instances' rules and user-added
 * rules. The active tab is derived from the filter state (this
 * instance's slice must exactly match an option), so it survives reload
 * and stays in sync with the filter chips; when no option matches, no
 * tab is active.
 *
 * Coexisting instances must have disjoint owned-property sets.
 *
 * @example
 * ```tsx
 * <DataViewProvider …>
 *   <PresetTabs options={presets} trailing={<NotionToolbarActions enableSettings />} />
 *   <NotionToolbarChips />
 *   <GalleryView … />
 * </DataViewProvider>
 * ```
 */
function PresetTabsComponent({
  "aria-label": ariaLabel,
  className,
  mobileSelect = true,
  onActiveChange,
  options,
  trailing,
  variant = "segmented",
}: PresetTabsProps) {
  const { setGroup, clearGroup } = useGroupParams();
  const { filter, setFilter, clearFilter } = useFilterParams();
  const { setSort, clearSort } = useSortParams();

  // Properties referenced by any option's filter. Selecting a tab swaps
  // the rules on these properties and leaves the rest of the filter alone.
  const ownedProperties = useMemo(() => {
    const owned = new Set<string>();
    for (const option of options) {
      collectFilterProperties(option.filter ?? [], owned);
    }
    return owned;
  }, [options]);

  // Derive the active option: this instance's slice of the filter must
  // exactly match an option's nodes (canonical DSL string compare).
  const activeLabel = useMemo(() => {
    const extracted = extractPropertiesFromFilter(
      filter ?? [],
      ownedProperties
    );
    const encoded = encodeFilter(extracted);
    const active = options.find(
      (option) =>
        option.filter !== undefined &&
        encodeFilter(option.filter ?? []) === encoded
    );
    return active?.label ?? null;
  }, [filter, options, ownedProperties]);

  const previousLabel = useRef(activeLabel);
  useEffect(() => {
    if (previousLabel.current === activeLabel) {
      return;
    }
    previousLabel.current = activeLabel;
    onActiveChange?.(activeLabel);
  }, [activeLabel, onActiveChange]);

  const handleValueChange = (label: string | null) => {
    if (!label) {
      return;
    }
    const option = options.find((opt) => opt.label === label);
    if (!option) {
      return;
    }

    if (option.group === null) {
      clearGroup();
    } else if (option.group !== undefined) {
      setGroup(option.group);
    }

    if (option.filter !== undefined) {
      const preserved = removePropertiesFromFilter(
        filter ?? [],
        ownedProperties
      );
      const next = option.filter ? [...preserved, ...option.filter] : preserved;
      if (next.length > 0) {
        setFilter(next);
      } else {
        clearFilter();
      }
    }

    if (option.sort === null) {
      clearSort();
    } else if (option.sort !== undefined) {
      setSort(option.sort);
    }
  };

  const isLine = variant === "line";
  const hasTrailing = trailing !== null && trailing !== undefined;

  const select = mobileSelect ? (
    <Select onValueChange={handleValueChange} value={activeLabel}>
      <SelectTrigger
        aria-label={ariaLabel ?? "View"}
        className="flex w-fit sm:hidden"
      >
        <SelectValue placeholder="Select a view" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.label} value={option.label}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : null;

  const tabsList = (
    <TabsList
      aria-label={ariaLabel}
      className={cn(
        mobileSelect ? "hidden sm:flex" : "flex",
        isLine && "justify-start gap-4 overflow-x-auto rounded-none p-0",
        // With trailing content the list shares the row: shrink + scroll
        // instead of taking the full width, and the underline border moves
        // to the shared row wrapper so it spans tabs + trailing at one y.
        isLine && (hasTrailing ? "min-w-0 flex-1" : "w-full border-b")
      )}
      variant={isLine ? "line" : "default"}
    >
      {options.map((option) => (
        <TabsTrigger
          className={
            isLine
              ? "flex-none border-0 text-muted-foreground after:bg-primary data-active:font-semibold group-data-horizontal/tabs:after:bottom-[-0.5px]"
              : undefined
          }
          key={option.label}
          value={option.label}
        >
          {option.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );

  return (
    <Tabs
      className={className}
      onValueChange={handleValueChange}
      value={activeLabel}
    >
      {hasTrailing ? (
        <div
          className={
            isLine
              ? // Single border on the row: the h-8 list and the 32px icon
                // buttons are equal height, so tabs + trailing share one
                // underline instead of two misaligned ones.
                "flex w-full items-center border-b"
              : "flex h-9 items-center gap-2"
          }
        >
          {select}
          {tabsList}
          <div
            className={
              isLine
                ? "flex items-center gap-2 pl-2"
                : "ml-auto flex items-center gap-2"
            }
          >
            {trailing}
          </div>
        </div>
      ) : (
        <>
          {select}
          {tabsList}
        </>
      )}
    </Tabs>
  );
}

// Static slot marker for DataViewProvider child splitting (NotionToolbar
// pattern): a PresetTabs placed directly under DataViewProvider renders in
// the toolbar slot, above the content.
PresetTabsComponent.dataViewSlot = "toolbar" as const;

/**
 * PresetTabs with static slot marker.
 * When placed inside DataViewProvider, it renders outside the suspending
 * QueryBridge, in JSX order with other toolbar-slot children.
 */
export const PresetTabs = PresetTabsComponent as typeof PresetTabsComponent & {
  dataViewSlot: "toolbar";
};
