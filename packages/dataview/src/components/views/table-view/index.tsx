"use client";

import type {
  ColumnDef,
  RowSelectionState,
  Table as TanStackTable,
} from "@tanstack/react-table";
import { AlertCircle } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import type { GroupedDataItem } from "../../../hooks";
import { useDisplayProperties, useViewSetup } from "../../../hooks";
import type { UseGroupQueryResult } from "../../../hooks/use-group-query";
import { useDataViewContext } from "../../../lib/providers/data-view-context";
import { cn, transformData } from "../../../lib/utils";
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
import { SuspendingGroupContent } from "../../ui/suspending-group-content";
import { DataCell } from "../data-cell";
import { DataTable } from "./data-table";
import { TableSkeleton } from "./table-skeleton";

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
    groupKeys,
    expandedGroups,
    onExpandedGroupsChange,
  } = useDataViewContext<TData, TProperties>();

  // Use shared view setup hook
  const {
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

  // GROUPED VIEW with Per-Group Suspense
  if (group && groupKeys && groupKeys.length > 0) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <Accordion
          multiple
          onValueChange={onExpandedGroupsChange}
          value={expandedGroups ?? []}
        >
          {groupedData?.map((groupItem: GroupedDataItem<TData>) => {
            const isExpanded = expandedGroups?.includes(groupItem.key) ?? false;

            return (
              <GroupSection
                group={groupItem}
                groupByPropertyDef={groupByProperty}
                key={groupItem.key}
                showAggregation={group.showCount ?? true}
                stickyHeader={{ enabled: true, offset: 57 }}
              >
                {isExpanded ? (
                  <Suspense
                    fallback={
                      <TableSkeleton
                        columnCount={displayProperties.length}
                        rowCount={5}
                        withPagination={false}
                      />
                    }
                  >
                    <SuspendingGroupTableContent<TData, TProperties>
                      actionBar={actionBar}
                      columns={columns}
                      enableRowSelection={enableRowSelection}
                      groupByProperty={groupByProperty}
                      groupItem={groupItem}
                      headerOffset={101}
                      onRowClick={onRowClick}
                      onRowSelectionChange={setRowSelection}
                      pagination={pagination}
                      properties={properties}
                      rowSelection={rowSelection}
                      showAggregation={group.showCount ?? true}
                      showVerticalLines={showVerticalLines}
                      wrapAllColumns={wrapAllColumns}
                    />
                  </Suspense>
                ) : null}
              </GroupSection>
            );
          })}
        </Accordion>
      </div>
    );
  }

  // FLAT VIEW: Uses SuspendingGroupContent with __ungrouped__ key
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Suspense
        fallback={
          <TableSkeleton
            columnCount={displayProperties.length}
            rowCount={10}
            withPagination={Boolean(pagination)}
          />
        }
      >
        <SuspendingGroupTableContent<TData, TProperties>
          actionBar={actionBar}
          columns={columns}
          enableRowSelection={enableRowSelection}
          groupByProperty={undefined}
          groupItem={{
            key: "__ungrouped__",
            items: [],
            count: 0,
            displayCount: "0",
            sortValue: "",
          }}
          headerOffset={57}
          onRowClick={onRowClick}
          onRowSelectionChange={setRowSelection}
          pagination={pagination}
          properties={properties}
          rowSelection={rowSelection}
          showAggregation={false}
          showVerticalLines={showVerticalLines}
          wrapAllColumns={wrapAllColumns}
        />
      </Suspense>
    </div>
  );
}

// ============================================================================
// Suspending Group Content Component
// ============================================================================

interface SuspendingGroupTableContentProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  actionBar?: (table: TanStackTable<TData>) => React.ReactNode;
  columns: ColumnDef<TData>[];
  enableRowSelection: boolean;
  groupByProperty?: TProperties[number];
  groupItem: GroupedDataItem<TData>;
  /** Offset for sticky header (57 for flat, 101 for grouped with GroupSection above) */
  headerOffset: number;
  onRowClick?: (row: TData) => void;
  onRowSelectionChange: (state: RowSelectionState) => void;
  pagination?: PaginationMode;
  properties: TProperties;
  rowSelection: RowSelectionState;
  showAggregation: boolean;
  showVerticalLines: boolean;
  wrapAllColumns: boolean;
}

/**
 * Internal component that fetches data for a group using Suspense.
 * Renders inside GroupSection's AccordionContent.
 */
function SuspendingGroupTableContent<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  actionBar,
  columns,
  enableRowSelection,
  groupItem,
  headerOffset,
  onRowClick,
  onRowSelectionChange,
  pagination,
  properties,
  rowSelection,
  showVerticalLines,
  wrapAllColumns,
}: SuspendingGroupTableContentProps<TData, TProperties>) {
  return (
    <SuspendingGroupContent<TData> groupKey={groupItem.key}>
      {(result: UseGroupQueryResult<TData>) => {
        // Transform data with property definitions
        const transformedItems = transformData(
          result.data,
          properties
        ) as TData[];

        // Build pagination context from query result
        const paginationContext: PaginationContext = {
          displayEnd: result.displayEnd,
          displayStart: result.displayStart,
          hasMoreThanMax: groupItem.displayCount === "99+",
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
          isFetching: result.isFetching,
          limit: result.limit,
          onLimitChange: result.onLimitChange,
          onNext: result.onNext,
          onPrev: result.onPrev,
          totalCount: groupItem.count,
        };

        return (
          <>
            <DataTable
              actionBar={actionBar}
              columns={columns}
              data={transformedItems}
              enableRowSelection={enableRowSelection}
              header={{ enabled: true, sticky: true }}
              offset={headerOffset}
              onRowClick={onRowClick}
              onRowSelectionChange={onRowSelectionChange}
              rowSelection={rowSelection}
              showVerticalLines={showVerticalLines}
              wrapAllColumns={wrapAllColumns}
            />
            {renderPagination(pagination, paginationContext)}
          </>
        );
      }}
    </SuspendingGroupContent>
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
