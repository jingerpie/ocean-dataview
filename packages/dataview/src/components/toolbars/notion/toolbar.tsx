// biome-ignore-all lint/performance/noBarrelFile: `./toolbars/notion` package export path — surfaces the pieces for app consumers
"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../../lib/utils";
import type { PropertyMeta } from "../../../types/property.type";
import { NotionToolbarActions } from "./toolbar-actions";
import { NotionToolbarChips } from "./toolbar-chips";

interface NotionToolbarProps extends ComponentProps<"div"> {
  /** Children (tabs, etc.) - always visible on left */
  children?: ReactNode;
  /** Current column property name (board view only) */
  columnProperty?: string;
  /** Enable column setting in settings panel (board view only) */
  enableColumn?: boolean;
  /** Enable filter functionality */
  enableFilter?: boolean;
  /** Enable search functionality */
  enableSearch?: boolean;
  /** Enable view settings panel */
  enableSettings?: boolean;
  /** Enable sort functionality */
  enableSort?: boolean;
  /** Current group property name (displayed in settings panel) */
  groupProperty?: string;
  /** Property schema for filtering/sorting (optional if using context) */
  properties?: readonly PropertyMeta[];
}

/**
 * Notion-style toolbar with two-row layout — the composition of
 * `NotionToolbarActions` (row 1, right) and `NotionToolbarChips` (row 2).
 *
 * When used inside DataViewProvider, reads properties and visibility from
 * context. Props can override context values if needed.
 *
 * State managed via nuqs URL params:
 * - ?filter={...} for filters
 * - ?sort=[...] for sorting
 * - ?search=... for search
 *
 * Row 1: [children] -------- [Filter] [Sort] [Search] [Settings]
 * Row 2: [SortList] [Filter Chips...] [+ Filter] (conditional)
 *
 * @example
 * ```tsx
 * // Plain view — recommended when there are no preset rows
 * <DataViewProvider properties={productProperties} …>
 *   <NotionToolbar enableSettings />
 *   <TableView />
 * </DataViewProvider>
 *
 * // Preset rows — use the pieces directly so the actions sit on the tab row
 * <DataViewProvider …>
 *   <PresetTabs options={presets} trailing={<NotionToolbarActions enableSettings />} />
 *   <NotionToolbarChips />
 *   <GalleryView … />
 * </DataViewProvider>
 * ```
 */
function NotionToolbarComponent({
  children,
  className,
  columnProperty,
  enableColumn,
  enableFilter,
  enableSearch,
  enableSettings,
  enableSort,
  groupProperty,
  properties,
  ...props
}: NotionToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {/* Row 1: children left, actions right */}
      <div className="flex h-9 items-center gap-2">
        {children && <div className="flex flex-1 gap-2">{children}</div>}
        <NotionToolbarActions
          className="ml-auto"
          columnProperty={columnProperty}
          enableColumn={enableColumn}
          enableFilter={enableFilter}
          enableSearch={enableSearch}
          enableSettings={enableSettings}
          enableSort={enableSort}
          groupProperty={groupProperty}
          properties={properties}
        />
      </div>

      {/* Row 2: chips bar (conditional) */}
      <NotionToolbarChips properties={properties} />
    </div>
  );
}

// Add static slot marker for DataViewProvider child splitting
NotionToolbarComponent.dataViewSlot = "toolbar" as const;

/**
 * NotionToolbar with static slot marker.
 * When placed inside DataViewProvider, it renders outside the suspending QueryBridge.
 */
export const NotionToolbar =
  NotionToolbarComponent as typeof NotionToolbarComponent & {
    dataViewSlot: "toolbar";
  };

export type { NotionToolbarActionsProps } from "./toolbar-actions";

export { NotionToolbarActions } from "./toolbar-actions";
export type { NotionToolbarChipsProps } from "./toolbar-chips";
export { NotionToolbarChips } from "./toolbar-chips";
export type { NotionToolbarProps };
