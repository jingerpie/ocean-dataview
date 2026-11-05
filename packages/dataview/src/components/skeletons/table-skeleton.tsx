"use client";

import { cn } from "../../lib/utils";
import type { PaginationMode } from "../ui/pagination";
import { PaginationSkeleton } from "../ui/pagination/pagination-skeleton";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  getSkeletonProps,
  type SkeletonPropertyLike,
} from "./get-skeleton-props";
import { TABLE_COLUMN_WIDTHS } from "./skeleton-widths";

interface TableSkeletonProps extends React.ComponentProps<"div"> {
  /**
   * Show bulk selection checkbox column
   * @default false
   */
  bulkActions?: boolean;
  /**
   * Pagination mode - matches TableView pagination prop
   */
  pagination?: PaginationMode;
  /**
   * Property schema - derives types and sizes automatically, filtering hidden properties.
   */
  properties?: readonly SkeletonPropertyLike[];
  /**
   * Number of rows to display
   */
  rowCount: number;
}

export function TableSkeleton({
  pagination,
  properties,
  rowCount,
  bulkActions = false,
  className,
  ...props
}: TableSkeletonProps) {
  const { propertyTypes, propertySizes } = getSkeletonProps(properties ?? []);

  return (
    <div className={cn("flex w-full flex-col gap-2.5", className)} {...props}>
      <div className="overflow-clip">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {bulkActions && (
                <TableHead className="w-6 pr-0">
                  <Skeleton className="size-4 rounded" />
                </TableHead>
              )}
              {propertyTypes.map((type, j) => {
                const width = propertySizes[j] ?? TABLE_COLUMN_WIDTHS[type];
                return (
                  <TableHead
                    key={j}
                    style={{ minWidth: width, maxWidth: width }}
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
                {bulkActions && (
                  <TableCell className="w-6 pr-0">
                    <Skeleton className="size-4 rounded" />
                  </TableCell>
                )}
                {propertyTypes.map((type, j) => {
                  const width = propertySizes[j] ?? TABLE_COLUMN_WIDTHS[type];
                  return (
                    <TableCell
                      key={j}
                      style={{ minWidth: width, maxWidth: width }}
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
