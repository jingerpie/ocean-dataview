"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../../../lib/utils";
import type { PaginationContext } from "../../../types/pagination";
import { Button } from "../button";
import {
  Select,
  SelectContent,
  SelectGroup,
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
  isFetching = false,
  displayStart,
  displayEnd,
}: PagePaginationProps) {
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is not visible, the pagination is stuck
        setIsSticky(entry ? !entry.isIntersecting : false);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  if (!(onNext || onPrev)) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "sticky bottom-0 z-10 flex items-center justify-between gap-6 bg-background px-2 py-3",
          isSticky && "border-t"
        )}
      >
        <div className="flex items-center gap-3">
          <nav
            aria-label="pagination"
            className="flex w-auto items-center gap-1"
          >
            <Button
              aria-label="Go to previous page"
              disabled={!hasPrev || isFetching}
              onClick={onPrev}
              size="icon"
              variant="outline"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              aria-label="Go to next page"
              disabled={!hasNext || isFetching}
              onClick={onNext}
              size="icon"
              variant="outline"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </nav>
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

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Rows per page</span>
          <Select
            onValueChange={(value) =>
              onLimitChange?.(Number(value) as 10 | 25 | 50 | 100)
            }
            value={String(limit)}
          >
            <SelectTrigger className="h-8 w-18">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {[10, 25, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Sentinel: when this is out of view, pagination is stuck to bottom */}
      <div className="-mt-4" ref={sentinelRef} />
    </>
  );
}
