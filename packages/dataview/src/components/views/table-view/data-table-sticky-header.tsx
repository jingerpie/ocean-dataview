"use client";

import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDebouncedCallback } from "../../../hooks/use-debounced-callback";
import { Table, TableHead, TableHeader, TableRow } from "../../ui/table";

const RESIZE_DEBOUNCE_MS = 150;

interface DataTableStickyHeaderProps<TData> {
  table: TanstackTable<TData>;
  enabled: boolean;
  tableHeaderRef: React.RefObject<HTMLTableSectionElement | null>;
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
  offset?: number;
}

export function DataTableStickyHeader<TData>({
  table,
  enabled,
  tableHeaderRef,
  tableContainerRef,
  offset = 0,
}: DataTableStickyHeaderProps<TData>) {
  const stickyHeaderScrollRef = useRef<HTMLDivElement>(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const [stickyTopOffset, setStickyTopOffset] = useState<number>(offset);

  // Shared scroll state for instant synchronization
  const scrollStateRef = useRef({ scrollLeft: 0, isUpdating: false });

  // Scroll handler logic (reads from refs)
  const handleScrollLogic = useCallback(() => {
    const headerElement = tableHeaderRef.current;
    const containerElement = tableContainerRef.current;
    if (!(headerElement && containerElement)) {
      return;
    }

    // Check if header top is above the sticky threshold
    const headerRect = headerElement.getBoundingClientRect();
    const contRect = containerElement.getBoundingClientRect();

    setShowStickyHeader(
      headerRect.top < offset && contRect.bottom > offset + headerRect.height
    );

    // Update container rect
    setContainerRect(contRect);
  }, [tableHeaderRef, tableContainerRef, offset]);

  // Resize handler logic (reads from refs)
  const handleResizeLogic = useCallback(() => {
    const headerElement = tableHeaderRef.current;
    const containerElement = tableContainerRef.current;
    if (!(headerElement && containerElement)) {
      return;
    }

    // Update sticky offset
    setStickyTopOffset(offset);

    // Get column widths from the original header
    const headerCells = headerElement.querySelectorAll("th");
    const widths = Array.from(headerCells).map(
      (cell) => cell.getBoundingClientRect().width
    );
    setColumnWidths(widths);

    // Also update scroll logic
    handleScrollLogic();
  }, [tableHeaderRef, tableContainerRef, offset, handleScrollLogic]);

  // Debounced resize handler (150ms)
  const debouncedResizeHandler = useDebouncedCallback(
    handleResizeLogic,
    RESIZE_DEBOUNCE_MS
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setShowStickyHeader(false);
      return;
    }

    const headerElement = tableHeaderRef.current;
    const containerElement = tableContainerRef.current;
    if (!(headerElement && containerElement)) {
      return;
    }

    // Synchronous scroll update function
    const updateScrollPosition = (newScrollLeft: number) => {
      if (scrollStateRef.current.isUpdating) {
        return;
      }

      scrollStateRef.current.isUpdating = true;
      scrollStateRef.current.scrollLeft = newScrollLeft;

      // Update both containers synchronously
      const stickyScrollElement = stickyHeaderScrollRef.current;

      if (containerElement.scrollLeft !== newScrollLeft) {
        containerElement.scrollLeft = newScrollLeft;
      }

      if (
        stickyScrollElement &&
        stickyScrollElement.scrollLeft !== newScrollLeft
      ) {
        stickyScrollElement.scrollLeft = newScrollLeft;
      }

      // Reset flag synchronously (no RAF needed)
      scrollStateRef.current.isUpdating = false;
    };

    // Initial setup (call immediately, not debounced)
    handleResizeLogic();

    // Update on resize - use debounced handler
    const resizeObserver = new ResizeObserver(() => {
      debouncedResizeHandler();
    });

    resizeObserver.observe(containerElement);

    const handleTableScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      updateScrollPosition(target.scrollLeft);
    };

    window.addEventListener("scroll", handleScrollLogic, { passive: true });
    containerElement.addEventListener("scroll", handleTableScroll, {
      passive: true,
    });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", handleScrollLogic);
      containerElement.removeEventListener("scroll", handleTableScroll);
    };
  }, [
    enabled,
    tableHeaderRef,
    tableContainerRef,
    handleResizeLogic,
    handleScrollLogic,
    debouncedResizeHandler,
  ]);

  // Effect for sticky header scroll synchronization
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const stickyScrollElement = stickyHeaderScrollRef.current;
    const containerElement = tableContainerRef.current;

    if (!(stickyScrollElement && containerElement && showStickyHeader)) {
      return;
    }

    // Synchronous scroll update function
    const updateScrollPosition = (newScrollLeft: number) => {
      if (scrollStateRef.current.isUpdating) {
        return;
      }

      scrollStateRef.current.isUpdating = true;
      scrollStateRef.current.scrollLeft = newScrollLeft;

      // Update both containers synchronously
      if (containerElement.scrollLeft !== newScrollLeft) {
        containerElement.scrollLeft = newScrollLeft;
      }

      if (stickyScrollElement.scrollLeft !== newScrollLeft) {
        stickyScrollElement.scrollLeft = newScrollLeft;
      }

      // Reset flag synchronously
      scrollStateRef.current.isUpdating = false;
    };

    const handleStickyScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      updateScrollPosition(target.scrollLeft);
    };

    // Sync initial position immediately
    stickyScrollElement.scrollLeft = scrollStateRef.current.scrollLeft;

    // Add listeners
    stickyScrollElement.addEventListener("scroll", handleStickyScroll, {
      passive: true,
    });

    return () => {
      stickyScrollElement.removeEventListener("scroll", handleStickyScroll);
    };
  }, [enabled, showStickyHeader, tableContainerRef]);

  // Don't render anything if not enabled, not mounted, or conditions not met
  if (
    !(enabled && mounted && showStickyHeader && containerRect) ||
    columnWidths.length === 0
  ) {
    return null;
  }

  // Render the sticky header using a portal
  return createPortal(
    <div
      className="fixed z-40 bg-muted"
      style={{
        top: stickyTopOffset,
        left: Math.max(0, containerRect.left),
        width: Math.min(
          containerRect.width,
          window.innerWidth - Math.max(0, containerRect.left)
        ),
      }}
    >
      <div
        className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        ref={stickyHeaderScrollRef}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, headerIndex) => (
                  <TableHead
                    colSpan={header.colSpan}
                    key={header.id}
                    style={{
                      ...(columnWidths[headerIndex]
                        ? {
                            width: columnWidths[headerIndex],
                            minWidth: columnWidths[headerIndex],
                            maxWidth: columnWidths[headerIndex],
                          }
                        : {}),
                    }}
                  >
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
        </Table>
      </div>
    </div>,
    document.body
  );
}
