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
  BulkAction,
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
import { DataCell } from "../data-cell";
import { DataTable } from "./data-table";

export interface TableViewProps<TData> {
  /**
   * Bulk actions for operations on selected rows.
   * When provided, automatically enables:
   * - Row selection with checkboxes
   * - Floating action bar for bulk operations
   *
   * For row-level actions, use button property type instead.
   */
  bulkActions?: BulkAction<TData>[];

  /**
   * Additional className
   */
  className?: string;

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
   * Show vertical lines between columns
   * @default true
   */
  showVerticalLines?: boolean;

  /**
   * Wrap text in all columns
   * @default true
   */
  wrapAllColumns?: boolean;
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
  bulkActions,
  className,
  onRowClick,
  pagination,
  showVerticalLines = true,
  wrapAllColumns = true,
}: TableViewProps<TData>) {
  // Get data and properties from context
  const {
    data,
    properties,
    propertyVisibility,
    pagination: contextPagination,
    counts,
    group,
  } = useDataViewContext<TData, TProperties>();

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
    group,
    contextPagination,
    counts,
  });

  // Enable row selection when bulkActions are provided
  const enableRowSelection = Boolean(bulkActions && bulkActions.length > 0);

  // Internal row selection state (always internal when using bulkActions)
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

    // Add selection column if rowActions provided
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

    return allColumns;
  }, [displayProperties, properties, enableRowSelection]);

  // Generate action bar if bulkActions provided
  const actionBar = useMemo(() => {
    if (!bulkActions || bulkActions.length === 0) {
      return undefined;
    }

    // Capture bulkActions in closure to satisfy TypeScript
    const actions = bulkActions;

    function TableActionBar(table: TanStackTable<TData>) {
      const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map((r) => r.original);

      return (
        <DataActionBar table={table}>
          <DataActionBarSelection table={table} />
          {actions.map((action) => (
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
  }, [bulkActions]);

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
  if (group && groupedData) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <Accordion
          multiple
          onValueChange={group.onExpandedChange}
          value={group.expanded ?? []}
        >
          {groupedData.map((groupItem: GroupedDataItem<TData>) => {
            // Build pagination context for this group using the utility function
            // which handles hasNext resolution (boolean | Record<string, boolean>)
            const basePaginationContext = buildPaginationContext(
              contextPagination,
              groupItem.key
            );
            const paginationContext: PaginationContext | undefined =
              basePaginationContext
                ? {
                    ...basePaginationContext,
                    totalCount: groupItem.count,
                    hasMoreThanMax: groupItem.displayCount === "99+",
                  }
                : undefined;

            return (
              <GroupSection
                group={groupItem}
                groupByPropertyDef={groupByProperty}
                isLoading={false}
                key={groupItem.key}
                renderFooter={renderPagination(pagination, paginationContext)}
                showAggregation={group.showCount ?? true}
                stickyHeader={{ enabled: true, offset: 57 }}
              >
                <DataTable
                  actionBar={actionBar}
                  columns={columns}
                  data={groupItem.items}
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
