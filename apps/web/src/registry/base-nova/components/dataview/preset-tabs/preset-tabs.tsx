"use client";

import { type TabOption, usePresetTabs } from "@jingerpie/dataview-react";
import { Tabs, TabsList, TabsTrigger } from "@sparkyidea/ui/components/tabs";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/base-nova/ui/dataview-select";

export type { TabOption } from "@jingerpie/dataview-react";

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
export function PresetTabs({
  "aria-label": ariaLabel,
  className,
  mobileSelect = true,
  onActiveChange,
  options,
  trailing,
  variant = "segmented",
}: PresetTabsProps) {
  const { activeLabel, selectOption: handleValueChange } = usePresetTabs({
    onActiveChange,
    options,
  });

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
