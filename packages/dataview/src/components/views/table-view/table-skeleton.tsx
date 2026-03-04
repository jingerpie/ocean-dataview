"use client";

import { cn } from "../../../lib/utils";
import { Skeleton } from "../../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";

interface TableSkeletonProps extends React.ComponentProps<"div"> {
  /**
   * Column width pattern, cycles if fewer than columnCount
   * @default ["auto"]
   */
  cellWidths?: string[];
  /**
   * Number of columns to display
   * @default 5
   */
  columnCount?: number;
  /**
   * Number of rows to display
   * @default 10
   */
  rowCount?: number;
  /**
   * Use minWidth for columns (prevents shrinking)
   * @default false
   */
  shrinkZero?: boolean;
  /**
   * Show pagination skeleton
   * @default true
   */
  withPagination?: boolean;
}

export function TableSkeleton({
  columnCount = 5,
  rowCount = 10,
  cellWidths = ["auto"],
  withPagination = true,
  shrinkZero = false,
  className,
  ...props
}: TableSkeletonProps) {
  // Cycle through cellWidths for each column
  const resolvedCellWidths = Array.from(
    { length: columnCount },
    (_, index) => cellWidths[index % cellWidths.length] ?? "auto"
  );

  return (
    <div
      className={cn("flex w-full flex-col gap-2.5 overflow-auto", className)}
      {...props}
    >
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {Array.from({ length: columnCount }).map((_, j) => (
                <TableHead
                  key={j}
                  style={{
                    width: resolvedCellWidths[j],
                    minWidth: shrinkZero ? resolvedCellWidths[j] : "auto",
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
                {Array.from({ length: columnCount }).map((_, j) => (
                  <TableCell
                    key={j}
                    style={{
                      width: resolvedCellWidths[j],
                      minWidth: shrinkZero ? resolvedCellWidths[j] : "auto",
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

      {/* Pagination */}
      {withPagination && (
        <div className="flex w-full items-center justify-between gap-4 overflow-auto p-1 sm:gap-8">
          <Skeleton className="h-7 w-40 shrink-0" />
          <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-7 w-[4.5rem]" />
            </div>
            <div className="flex items-center justify-center font-medium text-sm">
              <Skeleton className="h-7 w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="hidden size-7 lg:block" />
              <Skeleton className="size-7" />
              <Skeleton className="size-7" />
              <Skeleton className="hidden size-7 lg:block" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
