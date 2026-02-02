"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type RowSelectionState,
  type Table as TanStackTable,
  useReactTable,
} from "@tanstack/react-table";
import type * as React from "react";
import { useRef } from "react";
import { cn } from "../../../lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { DataTableStickyHeader } from "./data-table-sticky-header";

interface HeaderConfig {
  enabled: boolean;
  sticky?: boolean;
}

interface DataTableProps<TData> {
  /**
   * Data to display in the table
   */
  data: TData[];

  /**
   * Column definitions
   */
  columns: ColumnDef<TData>[];

  /**
   * Layout configuration
   */
  showVerticalLines?: boolean;
  wrapAllColumns?: boolean;

  /**
   * Row click handler
   */
  onRowClick?: (item: TData) => void;

  /**
   * Enable row selection with checkboxes
   */
  enableRowSelection?: boolean;

  /**
   * Row selection state
   */
  rowSelection?: RowSelectionState;

  /**
   * Row selection change callback
   */
  onRowSelectionChange?: (state: RowSelectionState) => void;

  /**
   * Action bar render function
   * Receives table instance for accessing selection state
   */
  actionBar?: (table: TanStackTable<TData>) => React.ReactNode;

  /**
   * Header configuration
   * Set to false to hide header, true to show header (default), or object for advanced config
   */
  header?: boolean | HeaderConfig;

  /**
   * Offset from top when sticky header is enabled (in pixels)
   */
  offset?: number;

  /**
   * Additional className for the table wrapper
   */
  className?: string;
}

/**
 * DataTable - Reusable table component
 * Handles table rendering with TanStack Table
 * Supports row selection and action bars
 */
export function DataTable<TData>({
  data,
  columns,
  showVerticalLines = true,
  wrapAllColumns = true,
  onRowClick,
  enableRowSelection = false,
  rowSelection = {},
  onRowSelectionChange,
  actionBar,
  header = true,
  offset = 0,
  className,
}: DataTableProps<TData>) {
  const tableHeaderRef = useRef<HTMLTableSectionElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const headerConfig: HeaderConfig =
    typeof header === "boolean"
      ? { enabled: header, sticky: false }
      : { ...header };
  // Create table instance with row selection support
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection,
    state: {
      rowSelection,
    },
    onRowSelectionChange: onRowSelectionChange
      ? (updaterOrValue) => {
          const newState =
            typeof updaterOrValue === "function"
              ? updaterOrValue(rowSelection)
              : updaterOrValue;
          onRowSelectionChange(newState);
        }
      : undefined,
  });

  // Check if any rows are selected
  const hasSelectedRows = table.getFilteredSelectedRowModel().rows.length > 0;

  return (
    <>
      {/* Sticky Header Component */}
      <DataTableStickyHeader
        enabled={!!headerConfig.sticky}
        offset={offset}
        table={table}
        tableContainerRef={tableContainerRef}
        tableHeaderRef={tableHeaderRef}
      />

      {/* Original Table */}
      <div
        className={cn("overflow-clip rounded-md border shadow-sm", className)}
      >
        <div className="overflow-x-auto" ref={tableContainerRef}>
          <Table>
            {headerConfig.enabled && (
              <TableHeader className="bg-muted" ref={tableHeaderRef}>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead colSpan={header.colSpan} key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
            )}
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="h-24 text-center text-muted-foreground"
                    colSpan={columns.length}
                  >
                    No data to display
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    className={cn(onRowClick && "cursor-pointer")}
                    data-state={row.getIsSelected() && "selected"}
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        className={cn(
                          showVerticalLines && "border-r last:border-r-0",
                          wrapAllColumns ? "whitespace-normal" : "truncate"
                        )}
                        key={cell.id}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Render action bar when rows are selected */}
      {hasSelectedRows && actionBar && actionBar(table)}
    </>
  );
}
