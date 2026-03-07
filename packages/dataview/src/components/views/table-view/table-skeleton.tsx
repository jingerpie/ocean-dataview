"use client";

import { TABLE_COLUMN_WIDTHS } from "../../../lib/constants/skeleton-widths";
import { cn } from "../../../lib/utils";
import type { PropertyType } from "../../../types";
import { PaginationSkeleton } from "../../ui/pagination-skeleton";
import { Skeleton } from "../../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";

type PaginationMode = "page" | "loadMore" | "infiniteScroll";

interface TableSkeletonProps extends React.ComponentProps<"div"> {
  /**
   * Pagination mode - matches TableView pagination prop
   */
  pagination?: PaginationMode;
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
              {propertyTypes.map((type, j) => (
                <TableHead
                  key={j}
                  style={{
                    minWidth: TABLE_COLUMN_WIDTHS[type],
                    maxWidth: TABLE_COLUMN_WIDTHS[type],
                  }}
                >
                  <Skeleton className="h-6 w-full" />
                </TableHead>
              ))}
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
                {propertyTypes.map((type, j) => (
                  <TableCell
                    key={j}
                    style={{
                      minWidth: TABLE_COLUMN_WIDTHS[type],
                      maxWidth: TABLE_COLUMN_WIDTHS[type],
                    }}
                  >
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationSkeleton mode={pagination} />
    </div>
  );
}
