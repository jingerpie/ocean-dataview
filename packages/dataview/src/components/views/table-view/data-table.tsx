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
import { useEffect, useRef } from "react";
import { useScrollSync } from "../../../hooks/use-scroll-sync";
import { cn } from "../../../lib/utils";
import type { PropertyType } from "../../../types/filter.type";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  TABLE_COLUMN_WIDTHS,
  TABLE_HEADER_CHAR_WIDTH,
  TABLE_HEADER_MAX_WIDTH,
  TABLE_HEADER_PADDING,
} from "../skeleton-widths";
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
   * Register a scroll container with external scroll sync.
   * When provided, DataTable uses this instead of creating its own sync.
   */
  /**
   * When true, renders just the <Table> without overflow wrappers or sticky header.
   * Used when the parent provides a shared scroll container.
   */
  /**
   * Hide the horizontal scrollbar. Used in grouped mode where
   * a shared scrollbar is provided at the view level.
   */
  hideScrollbar?: boolean;

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

  registerScroll?: (el: HTMLElement) => () => void;

  /**
   * Row selection state
   */
  rowSelection?: RowSelectionState;

  /**
   * Layout configuration
   */
  showVerticalLines?: boolean;
  wrapAllProperties?: boolean;
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
  wrapAllProperties = true,
  onRowClick,
  enableRowSelection = false,
  rowSelection = {},
  onRowSelectionChange,
  actionBar,
  header = true,
  offset = 0,
  className,
  hideScrollbar = false,
  registerScroll: externalRegisterScroll,
}: DataTableProps<TData>) {
  const tableHeaderRef = useRef<HTMLTableSectionElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { register: internalRegisterScroll } = useScrollSync();
  const registerScroll = externalRegisterScroll ?? internalRegisterScroll;

  // Register the table body scroll container with scroll sync
  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) {
      return;
    }
    return registerScroll(el);
  }, [registerScroll]);

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

  const tableElement = (
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
          >
            {row.getVisibleCells().map((cell) => {
              const meta = cell.column.columnDef.meta as
                | { propertyType?: PropertyType; wrap?: boolean }
                | undefined;
              const propertyType = meta?.propertyType;
              const cellWrap = meta?.wrap ?? wrapAllProperties;
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
                    cellWrap ? "whitespace-normal" : "truncate",
                    isSelectionColumn && "pr-0"
                  )}
                  key={cell.id}
                  style={{
                    minWidth: columnWidth,
                    maxWidth: columnWidth,
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <>
      {/* Sticky Header Component */}
      <DataTableStickyHeader
        enabled={!!headerConfig.sticky}
        offset={offset}
        registerScroll={registerScroll}
        table={table}
        tableContainerRef={tableContainerRef}
        tableHeaderRef={tableHeaderRef}
      />

      {/* Original Table */}
      <div className={cn("overflow-clip", className)}>
        <div
          className={cn(
            "overflow-x-auto",
            hideScrollbar &&
              "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          )}
          ref={tableContainerRef}
        >
          {tableElement}
        </div>
      </div>

      {/* Render action bar when rows are selected */}
      {hasSelectedRows && actionBar?.(table)}
    </>
  );
}
