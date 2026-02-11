"use client";

import type { PaginationContext } from "../../../types";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "../pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

type PagePaginationProps = Partial<PaginationContext>;

/**
 * PagePagination component with cursor-based navigation
 * Uses Previous/Next buttons instead of page numbers
 */
export function PagePagination({
  hasNext = false,
  hasPrev = false,
  onNext,
  onPrev,
  limit = 25,
  onLimitChange,
  limitOptions = [10, 25, 50, 100],
  isLoading = false,
  displayStart,
  displayEnd,
}: PagePaginationProps) {
  // Don't show if no navigation callbacks
  if (!(onNext || onPrev)) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-6 px-2">
      {/* Navigation and item range */}
      <div className="flex items-center gap-3">
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={!hasPrev || isLoading}
                onClick={onPrev}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                disabled={!hasNext || isLoading}
                onClick={onNext}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        {displayStart !== undefined && displayEnd !== undefined && (
          <div className="text-muted-foreground text-sm">
            {displayEnd > 0 ? (
              <>
                {displayStart}-{displayEnd}
              </>
            ) : (
              "No items"
            )}
          </div>
        )}
      </div>

      {/* Rows per page */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">Rows per page</span>
        <Select
          onValueChange={(value) => onLimitChange?.(Number(value))}
          value={String(limit)}
        >
          <SelectTrigger className="h-8 w-18">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {limitOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
