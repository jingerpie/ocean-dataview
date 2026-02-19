"use client";

import type {
  ColumnDef,
  RowSelectionState,
  Table as TanStackTable,
} from "@tanstack/react-table";
import { AlertCircle } from "lucide-react";
import { useMemo, useState } from "react";
import type { GroupedDataItem } from "../../../hooks";
import { useDisplayProperties, useViewSetup } from "../../../hooks";
import { useDataViewContext } from "../../../lib/providers/data-view-context";
import { buildPaginationContext, cn } from "../../../lib/utils";
import type {
  Action,
  DataViewProperty,
  PaginationContext,
} from "../../../types";
import { Accordion } from "../../ui/accordion";
import {
  DataActionBar,
  DataActionBarAction,
  DataActionBarSelection,
} from "../../ui/bulk-actions";
import { Checkbox } from "../../ui/checkbox";
import { GroupSection } from "../../ui/group-section";
import { type PaginationMode, renderPagination } from "../../ui/paginations";
import { SplitButton } from "../../ui/split-button";
import { DataCell } from "../data-cell";
import { DataTable } from "./data-table";

export interface TableViewProps<
  TData,
  TProperties extends
    readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
> {
  /**
   * Actions for rows and bulk operations
   * When provided, automatically enables:
   * - Row selection with checkboxes
   * - Actions column with row-level actions
   * - Floating action bar for bulk operations
   */
  actions?: Action<TData>[];

  /**
   * Additional className
   */
  className?: string;
  /**
   * Layout configuration
   */
  layout?: {
    showVerticalLines?: boolean;
    wrapAllColumns?: boolean;
  };

  /**
   * Row click handler
   */
  onRowClick?: (row: TData) => void;

  /**
   * Pagination mode for the table.
   * - "page": Classic prev/next pagination with "Showing X-Y"
   * - "loadMore": "Load more" button
   * - "infiniteScroll": Auto-load on scroll
   * - undefined: No pagination UI
   *
   * For grouped tables: renders inside each group
   * For flat tables: renders below the table
   */
  pagination?: PaginationMode;

  /**
   * View configuration
   */
  view?: {
    propertyVisibility?: TProperties[number]["id"][];

    /**
     * Group By configuration - creates collapsible groups in table
     */
    group?: {
      /** Property ID to group by (references property.id, not data key) */
      groupBy: TProperties[number]["id"];
      /**
       * How to group the data:
       * - For date properties: 'day' | 'week' | 'month' | 'year' | 'relative' (default: 'relative')
       * - For status properties: 'option' (group by status value) | 'group' (group by status group like todo/inProgress/complete) (default: 'option')
       * - For select/multi-select: 'option' (group by option value) (default behavior)
       */
      showAs?:
        | "day"
        | "week"
        | "month"
        | "year"
        | "relative"
        | "group"
        | "option";
      /** Week start day (only for showAs: 'week') */
      startWeekOn?: "monday" | "sunday";
      /** Sort groups by property value (default: 'propertyAscending') */
      sort?: "propertyAscending" | "propertyDescending";
      /** Hide groups with no items (default: true) */
      hideEmptyGroups?: boolean;
      /** Display aggregation counts in group headers (default: true) */
      showAggregation?: boolean;
      /** Controlled expansion state (array of expanded group keys) */
      expandedGroups?: string[];
      /** Callback when expansion state changes */
      onExpandedChange?: (groups: string[]) => void;
    };
  };
}

/**
 * TableView - Spreadsheet-style data display
 * Auto-generates columns from properties
 * Supports row selection and action bars
 */
export function TableView<
  TData,
  TProperties extends
    readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
>({
  layout = {},
  view = {},
  onRowClick,
  pagination,
  actions,
  className,
}: TableViewProps<TData, TProperties>) {
  // Get data and properties from context
  const {
    data,
    properties,
    propertyVisibility,
    pagination: contextPagination,
    setPropertyVisibility,
    counts,
  } = useDataViewContext<TData, TProperties>();

  const { showVerticalLines = true, wrapAllColumns = true } = layout;
  const { propertyVisibility: viewPropertyVisibility, group: groupBy } = view;

  // Use shared view setup hook
  const {
    transformedData,
    groupConfig,
    groupedData,
    groupByProperty,
    validationError,
    propertyValidationError,
  } = useViewSetup({
    data: data as TData[],
    properties,
    groupBy: groupBy
      ? {
          groupBy: String(groupBy.groupBy),
          showAs: groupBy.showAs,
          startWeekOn: groupBy.startWeekOn,
          sort: groupBy.sort,
          hideEmptyGroups: groupBy.hideEmptyGroups,
        }
      : undefined,
    viewPropertyVisibility,
    contextPagination,
    setPropertyVisibility,
    counts: counts?.group,
  });

  // Enable row selection when actions are provided
  const enableRowSelection = Boolean(actions && actions.length > 0);

  // Internal row selection state (always internal when using actions)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Use shared hook for display properties filtering
  const displayProperties = useDisplayProperties(
    properties,
    propertyVisibility,
    groupConfig ? [groupConfig.groupBy] : undefined
  );

  // Extract flat table data for non-grouped view (must be before early returns for hooks)
  const flatTableData = transformedData;

  // Generate columns from properties
  const columns = useMemo<ColumnDef<TData>[]>(() => {
    const propertyColumns: ColumnDef<TData>[] = displayProperties.map(
      (property) => ({
        id: String(property.id),
        accessorKey: String(property.id),
        header: property.label ?? String(property.id),
        cell: ({ getValue, row }) => (
          <DataCell
            allProperties={properties}
            item={row.original}
            property={property}
            value={getValue()}
          />
        ),
      })
    );

    const allColumns: ColumnDef<TData>[] = [];

    // Add selection column if actions provided
    if (enableRowSelection) {
      allColumns.push({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={
              !table.getIsAllPageRowsSelected() &&
              table.getIsSomePageRowsSelected()
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label="Select row"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      });
    }

    // Add property columns
    allColumns.push(...propertyColumns);

    // Add actions column if actions provided
    if (actions && actions.length > 0) {
      // Find primary action
      const primaryAction = actions.find((a) => a.primary);

      // Get row-level actions (exclude bulkOnly actions)
      const rowActions = actions.filter((a) => !a.bulkOnly);

      // Get dropdown actions (all row actions except primary)
      const dropdownActions = rowActions
        .filter((a) => !a.primary)
        .map((action) => ({
          label: action.label,
          onClick: () => undefined, // Will be set in cell render
          className:
            action.variant === "destructive"
              ? "text-destructive focus:text-destructive"
              : undefined,
        }));

      allColumns.push({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <SplitButton
            dropdownActions={dropdownActions.map((dropdownAction, idx) => ({
              ...dropdownAction,
              onClick: () => {
                const action = rowActions.filter((a) => !a.primary)[idx];
                if (action) {
                  action.onClick([row.original]);
                }
              },
            }))}
            onPrimaryAction={() => {
              if (primaryAction) {
                primaryAction.onClick([row.original]);
              }
            }}
            primaryIcon={primaryAction?.icon}
            primaryLabel={primaryAction?.label}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 80,
      });
    }

    return allColumns;
  }, [
    displayProperties,
    properties,
    wrapAllColumns,
    enableRowSelection,
    actions,
  ]);

  // Generate action bar if actions provided
  const actionBar = useMemo(() => {
    if (!actions || actions.length === 0) {
      return undefined;
    }

    // Capture actions in closure to satisfy TypeScript
    const definedActions = actions;

    function TableActionBar(table: TanStackTable<TData>) {
      const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map((r) => r.original);

      // Get bulk actions (exclude rowOnly actions)
      const bulkActions = definedActions.filter((a) => !a.rowOnly);

      return (
        <DataActionBar table={table}>
          <DataActionBarSelection table={table} />
          {bulkActions.map((action) => (
            <DataActionBarAction
              isPending={action.isPending}
              key={action.label}
              onClick={() => action.onClick(selectedRows)}
              tooltip={action.label}
            >
              {action.icon}
              {action.label}
            </DataActionBarAction>
          ))}
        </DataActionBar>
      );
    }

    return TableActionBar;
  }, [actions]);

  // Error state
  if (validationError || propertyValidationError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/5 p-8">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <p className="font-medium text-destructive">
          Invalid table configuration
        </p>
        <p className="mt-2 text-muted-foreground text-sm">
          {validationError || propertyValidationError}
        </p>
      </div>
    );
  }

  // GROUPED VIEW: Render using Accordion for collapsible groups
  // Note: Check grouped view before empty state, because with lazy loading
  // data might be empty but we still want to show group headers with counts
  if (groupBy && groupedData) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <Accordion
          multiple
          onValueChange={groupBy.onExpandedChange}
          value={groupBy.expandedGroups ?? []}
        >
          {groupedData.map((group: GroupedDataItem<TData>) => {
            // Build pagination context for this group using the utility function
            // which handles hasNext resolution (boolean | Record<string, boolean>)
            const basePaginationContext = buildPaginationContext(
              contextPagination,
              group.key
            );
            const paginationContext: PaginationContext | undefined =
              basePaginationContext
                ? {
                    ...basePaginationContext,
                    totalCount: group.count,
                    hasMoreThanMax: group.displayCount === "99+",
                  }
                : undefined;

            return (
              <GroupSection
                group={group}
                groupByPropertyDef={groupByProperty}
                isLoading={false}
                key={group.key}
                renderFooter={renderPagination(pagination, paginationContext)}
                showAggregation={groupBy?.showAggregation ?? true}
                stickyHeader={{ enabled: true, offset: 57 }}
              >
                <DataTable
                  actionBar={actionBar}
                  columns={columns}
                  data={group.items}
                  enableRowSelection={enableRowSelection}
                  header={{ enabled: true, sticky: true }}
                  offset={101} // 57 (navbar + border) + 44 (group label height)
                  onRowClick={onRowClick}
                  onRowSelectionChange={setRowSelection}
                  rowSelection={rowSelection}
                  showVerticalLines={showVerticalLines}
                  wrapAllColumns={wrapAllColumns}
                />
              </GroupSection>
            );
          })}
        </Accordion>
      </div>
    );
  }

  // Empty state for non-grouped view
  if (Array.isArray(data) && data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
        <p>No data to display</p>
      </div>
    );
  }

  // Build pagination context for flat view
  const flatPaginationContext = buildPaginationContext(
    contextPagination,
    "$all"
  );

  // STANDARD VIEW: Flat table without grouping
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <DataTable
        actionBar={actionBar}
        columns={columns}
        data={flatTableData}
        enableRowSelection={enableRowSelection}
        header={{ enabled: true, sticky: true }}
        offset={57}
        onRowClick={onRowClick}
        onRowSelectionChange={setRowSelection}
        rowSelection={rowSelection}
        showVerticalLines={showVerticalLines}
        wrapAllColumns={wrapAllColumns}
      />
      {renderPagination(pagination, flatPaginationContext)}
    </div>
  );
}

// Re-export from shared with view-specific aliases
export type { DataViewContextValue as TableContextValue } from "../../../lib/providers/data-view-context";
// biome-ignore lint/performance/noBarrelFile: Re-exporting shared components with view-specific names
export { useDataViewContext as useTableContext } from "../../../lib/providers/data-view-context";
export type { DataViewProviderProps as TableProviderProps } from "../../../lib/providers/data-view-provider";
export { DataViewProvider as TableProvider } from "../../../lib/providers/data-view-provider";
export {
  Visibility,
  type VisibilityProps,
} from "../../ui/toolbar/visibility";
// Skeleton
export { TableSkeleton } from "./table-skeleton";
