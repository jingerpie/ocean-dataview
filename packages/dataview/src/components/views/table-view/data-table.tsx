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
import {
  TABLE_COLUMN_WIDTHS,
  TABLE_HEADER_CHAR_WIDTH,
  TABLE_HEADER_MAX_WIDTH,
  TABLE_HEADER_PADDING,
} from "../../../lib/constants/skeleton-widths";
import { cn } from "../../../lib/utils";
import type { PropertyType } from "../../../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { DataTableStickyHeader } from "./data-table-sticky-header";

/**
 * Calculate column width based on property type and header label
 * Returns max(propertyWidth, headerLabelWidth), capped at TABLE_HEADER_MAX_WIDTH
 */
function calculateColumnWidth(
  propertyType: PropertyType | undefined,
  headerLabel: string | undefined
): number | undefined {
  if (!propertyType) {
    return undefined;
  }

  const propertyWidth = TABLE_COLUMN_WIDTHS[propertyType];
  const headerWidth = headerLabel
    ? headerLabel.length * TABLE_HEADER_CHAR_WIDTH + TABLE_HEADER_PADDING
    : 0;

  return Math.min(Math.max(propertyWidth, headerWidth), TABLE_HEADER_MAX_WIDTH);
}

interface HeaderConfig {
  enabled: boolean;
  sticky?: boolean;
}

interface DataTableProps<TData> {
  /**
   * Action bar render function
   * Receives table instance for accessing selection state
   */
  actionBar?: (table: TanStackTable<TData>) => React.ReactNode;

  /**
   * Additional className for the table wrapper
   */
  className?: string;

  /**
   * Column definitions
   */
  columns: ColumnDef<TData>[];
  /**
   * Data to display in the table
   */
  data: TData[];

  /**
   * Enable row selection with checkboxes
   */
  enableRowSelection?: boolean;

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
   * Row click handler
   */
  onRowClick?: (item: TData) => void;

  /**
   * Row selection change callback
   */
  onRowSelectionChange?: (state: RowSelectionState) => void;

  /**
   * Row selection state
   */
  rowSelection?: RowSelectionState;

  /**
   * Layout configuration
   */
  showVerticalLines?: boolean;
  wrapAllColumns?: boolean;
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
      <div className={cn("overflow-clip", className)}>
        <div className="overflow-x-auto" ref={tableContainerRef}>
          <Table>
            {headerConfig.enabled && (
              <TableHeader ref={tableHeaderRef}>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const meta = header.column.columnDef.meta as
                        | { propertyType?: PropertyType }
                        | undefined;
                      const propertyType = meta?.propertyType;
                      const headerDef = header.column.columnDef.header;
                      const headerLabel =
                        typeof headerDef === "string" ? headerDef : undefined;
                      const columnWidth = calculateColumnWidth(
                        propertyType,
                        headerLabel
                      );
                      const isSelectionColumn = header.id === "select";
                      return (
                        <TableHead
                          className={cn(isSelectionColumn && "pr-0")}
                          colSpan={header.colSpan}
                          key={header.id}
                          style={{
                            minWidth: columnWidth,
                            maxWidth: columnWidth,
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
            )}
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  className={cn(onRowClick && "cursor-pointer")}
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(row.original);
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as
                      | { propertyType?: PropertyType }
                      | undefined;
                    const propertyType = meta?.propertyType;
                    const headerDef = cell.column.columnDef.header;
                    const headerLabel =
                      typeof headerDef === "string" ? headerDef : undefined;
                    const columnWidth = calculateColumnWidth(
                      propertyType,
                      headerLabel
                    );
                    const isSelectionColumn = cell.column.id === "select";
                    return (
                      <TableCell
                        className={cn(
                          showVerticalLines && "border-r last:border-r-0",
                          wrapAllColumns ? "whitespace-normal" : "truncate",
                          isSelectionColumn && "pr-0"
                        )}
                        key={cell.id}
                        style={{
                          minWidth: columnWidth,
                          maxWidth: columnWidth,
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Render action bar when rows are selected */}
      {hasSelectedRows && actionBar && actionBar(table)}
    </>
  );
}
