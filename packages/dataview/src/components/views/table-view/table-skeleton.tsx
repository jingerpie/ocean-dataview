"use client";

import { cn } from "../../../lib/utils";
import type { PropertyType } from "../../../types/filter.type";
import type { PaginationMode } from "../../ui/pagination";
import { PaginationSkeleton } from "../../ui/pagination/pagination-skeleton";
import { Skeleton } from "../../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { TABLE_COLUMN_WIDTHS } from "../skeleton-widths";

interface TableSkeletonProps extends React.ComponentProps<"div"> {
  /**
   * Pagination mode - matches TableView pagination prop
   */
  pagination?: PaginationMode;
  /**
   * Property sizes (in pixels) - per-property size override.
   * Falls back to TABLE_COLUMN_WIDTHS[type] when undefined.
   */
  propertySizes?: (number | undefined)[];
  /**
   * Property types for each column - determines realistic widths
   */
  propertyTypes: PropertyType[];
  /**
   * Number of rows to display
   */
  rowCount: number;
  /**
   * Show bulk selection checkbox column
   * @default false
   */
  withBulkActions?: boolean;
}

export function TableSkeleton({
  pagination,
  propertySizes,
  propertyTypes,
  rowCount,
  withBulkActions = false,
  className,
  ...props
}: TableSkeletonProps) {
  return (
    <div className={cn("flex w-full flex-col gap-2.5", className)} {...props}>
      <div className="overflow-clip">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {/* Bulk selection checkbox column */}
              {withBulkActions && (
                <TableHead className="w-6 pr-0">
                  <Skeleton className="size-4 rounded" />
                </TableHead>
              )}
              {propertyTypes.map((type, j) => {
                const width = propertySizes?.[j] ?? TABLE_COLUMN_WIDTHS[type];
                return (
                  <TableHead
                    key={j}
                    style={{
                      minWidth: width,
                      maxWidth: width,
                    }}
                  >
                    <Skeleton className="h-6 w-full" />
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, i) => (
              <TableRow className="hover:bg-transparent" key={i}>
                {/* Bulk selection checkbox column */}
                {withBulkActions && (
                  <TableCell className="w-6 pr-0">
                    <Skeleton className="size-4 rounded" />
                  </TableCell>
                )}
                {propertyTypes.map((type, j) => {
                  const width = propertySizes?.[j] ?? TABLE_COLUMN_WIDTHS[type];
                  return (
                    <TableCell
                      key={j}
                      style={{
                        minWidth: width,
                        maxWidth: width,
                      }}
                    >
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationSkeleton mode={pagination} />
    </div>
  );
}
