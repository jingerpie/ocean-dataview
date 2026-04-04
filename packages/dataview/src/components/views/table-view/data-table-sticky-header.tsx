"use client";

import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "../../../hooks/use-debounced-callback";
import { useScrollParent } from "../../../hooks/use-scroll-parent";
import { Table, TableHead, TableHeader, TableRow } from "../../ui/table";

const RESIZE_DEBOUNCE_MS = 150;

interface DataTableStickyHeaderProps<TData> {
  enabled: boolean;
  /**
   * Offset from top of scroll container
   */
  offset?: number;
  /**
   * Register a scroll container with the external scroll sync.
   * Returns a cleanup function.
   */
  registerScroll: (el: HTMLElement) => () => void;
  table: TanstackTable<TData>;
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
  tableHeaderRef: React.RefObject<HTMLTableSectionElement | null>;
}

export function DataTableStickyHeader<TData>({
  table,
  enabled,
  tableHeaderRef,
  tableContainerRef,
  offset = 0,
  registerScroll,
}: DataTableStickyHeaderProps<TData>) {
  const stickyHeaderScrollRef = useRef<HTMLDivElement>(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);

  const getScrollParent = useScrollParent();

  // Visibility check: show sticky header when original header scrolls past threshold
  const handleScrollLogic = useCallback(() => {
    const headerElement = tableHeaderRef.current;
    const containerElement = tableContainerRef.current;
    if (!(headerElement && containerElement)) {
      return;
    }

    // Convert scroll-container-relative offset to viewport coords for getBoundingClientRect comparison
    const scrollParent = getScrollParent(containerElement);
    const scrollContainerTop =
      scrollParent === window
        ? 0
        : (scrollParent as HTMLElement).getBoundingClientRect().top;
    const viewportThreshold = scrollContainerTop + offset;

    const headerRect = headerElement.getBoundingClientRect();
    const contRect = containerElement.getBoundingClientRect();

    setShowStickyHeader(
      headerRect.top < viewportThreshold &&
        contRect.bottom > viewportThreshold + headerRect.height
    );
  }, [tableHeaderRef, tableContainerRef, offset, getScrollParent]);

  // Resize handler: recalculate column widths
  const handleResizeLogic = useCallback(() => {
    const headerElement = tableHeaderRef.current;
    if (!headerElement) {
      return;
    }

    const headerCells = headerElement.querySelectorAll("th");
    const widths = Array.from(headerCells).map(
      (cell) => cell.getBoundingClientRect().width
    );
    setColumnWidths(widths);

    handleScrollLogic();
  }, [tableHeaderRef, handleScrollLogic]);

  // Debounced resize handler (150ms)
  const debouncedResizeHandler = useDebouncedCallback(
    handleResizeLogic,
    RESIZE_DEBOUNCE_MS
  );

  // Visibility + resize listeners
  useEffect(() => {
    if (!enabled) {
      setShowStickyHeader(false);
      return;
    }

    const containerElement = tableContainerRef.current;
    if (!containerElement) {
      return;
    }

    // Initial setup
    handleResizeLogic();

    // Resize observer on table container
    const resizeObserver = new ResizeObserver(() => {
      handleScrollLogic();
      debouncedResizeHandler();
    });
    resizeObserver.observe(containerElement);

    // Listen for vertical scroll on the scroll parent
    const scrollParent = getScrollParent(containerElement);
    scrollParent.addEventListener("scroll", handleScrollLogic, {
      passive: true,
    });

    return () => {
      resizeObserver.disconnect();
      scrollParent.removeEventListener("scroll", handleScrollLogic);
    };
  }, [
    enabled,
    tableContainerRef,
    handleResizeLogic,
    handleScrollLogic,
    debouncedResizeHandler,
    getScrollParent,
  ]);

  // Register sticky header's inner scroll element with external scroll sync
  useEffect(() => {
    const el = stickyHeaderScrollRef.current;
    if (!(enabled && showStickyHeader && el)) {
      return;
    }
    return registerScroll(el);
  }, [enabled, showStickyHeader, registerScroll]);

  // Don't render anything if not enabled
  if (!enabled) {
    return null;
  }

  return (
    <div
      className="sticky z-40"
      style={{ top: offset, height: 0, overflow: "visible" }}
    >
      {showStickyHeader && columnWidths.length > 0 && (
        <div
          className="overflow-x-auto bg-background [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
      )}
    </div>
  );
}
