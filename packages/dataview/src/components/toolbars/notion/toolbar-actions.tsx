"use client";

import { useSearchParams } from "../../../hooks/use-search-params";
import { useQueryParamsState } from "../../../lib/providers/query-params-context";
import { useToolbarContext } from "../../../lib/providers/toolbar-context";
import { cn } from "../../../lib/utils";
import type { GroupConfigInput } from "../../../types/group.type";
import type { PropertyMeta } from "../../../types/property.type";
import { SearchInput } from "../../ui/search/search-input";
import { FilterTool } from "./filter-tool";
import { SettingsTool } from "./settings-tool";
import { SortTool } from "./sort-tool";

/**
 * Extract the property ID from a GroupConfigInput.
 */
function getGroupPropertyId(
  group: GroupConfigInput | null | undefined
): string | null {
  return group?.propertyId ?? null;
}

/**
 * Extract the property ID from a ColumnConfig.
 * ColumnConfig uses the same structure as GroupConfigInput.
 */
function getColumnPropertyId(
  column: GroupConfigInput | null | undefined
): string | null {
  return getGroupPropertyId(column);
}

interface NotionToolbarActionsProps {
  /** Accessible name for the toolbar landmark */
  "aria-label"?: string;
  /** Additional class names for the cluster container */
  className?: string;
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
 * The Notion toolbar's icon cluster: [Filter] [Sort] [Search] [Settings].
 *
 * Pairs with `<NotionToolbarChips />`: the Filter/Sort buttons toggle the
 * chips row via ToolbarContext, so without a Chips sibling they have
 * nothing to expand. Alignment and row height are the host's job — use
 * it as `PresetTabs` `trailing` content, or reach for `<NotionToolbar />`
 * for a plain view without preset rows.
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
function NotionToolbarActionsComponent({
  "aria-label": ariaLabel = "View controls",
  className,
  columnProperty,
  enableColumn = false,
  enableFilter = true,
  enableSearch = true,
  enableSettings = false,
  enableSort = true,
  groupProperty,
  properties: propProperties,
}: NotionToolbarActionsProps) {
  const { properties: ctxProperties, toggleChipsRow } = useToolbarContext();
  // Get query params (group, column) from QueryParamsContext
  const queryParams = useQueryParamsState();

  const properties = propProperties ?? ctxProperties;

  // Derive group property name from context if not provided
  const derivedGroupProperty = (() => {
    if (groupProperty !== undefined) {
      return groupProperty;
    }
    const groupPropertyId = getGroupPropertyId(queryParams.group);
    if (!groupPropertyId) {
      return undefined;
    }
    const meta = properties.find((p) => p.id === groupPropertyId);
    return meta?.name ?? groupPropertyId;
  })();

  // Derive column property name from context if not provided
  const derivedColumnProperty = (() => {
    if (columnProperty !== undefined) {
      return columnProperty;
    }
    const colPropertyId = getColumnPropertyId(queryParams.column);
    if (!colPropertyId) {
      return undefined;
    }
    const meta = properties.find((p) => p.id === colPropertyId);
    return meta?.name ?? colPropertyId;
  })();

  // Auto-enable column settings when column config exists (board view)
  const shouldEnableColumn = enableColumn || queryParams.column != null;

  const { search, setSearch: onSearchChange } = useSearchParams();

  return (
    <div
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      className={cn("flex items-center", className)}
      role="toolbar"
    >
      {enableFilter && (
        <FilterTool onToggle={toggleChipsRow} properties={properties} />
      )}

      {enableSort && (
        <SortTool onToggle={toggleChipsRow} properties={properties} />
      )}

      {enableSearch && (
        <SearchInput
          onChange={onSearchChange}
          placeholder="Type to search..."
          value={search}
          variant="icon"
        />
      )}

      {enableSettings && (
        <SettingsTool
          columnProperty={derivedColumnProperty}
          enableColumn={shouldEnableColumn}
          groupProperty={derivedGroupProperty}
          variant="icon"
        />
      )}
    </div>
  );
}

// Static slot marker for DataViewProvider child splitting. Inside a
// PresetTabs `trailing` slot the marker is ignored; as a direct provider
// child it keeps the cluster in the toolbar group, outside the suspending
// QueryBridge.
NotionToolbarActionsComponent.dataViewSlot = "toolbar" as const;

/**
 * NotionToolbarActions with static slot marker.
 */
export const NotionToolbarActions =
  NotionToolbarActionsComponent as typeof NotionToolbarActionsComponent & {
    dataViewSlot: "toolbar";
  };

export type { NotionToolbarActionsProps };
