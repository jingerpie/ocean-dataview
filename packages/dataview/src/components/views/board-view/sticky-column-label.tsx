"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useScrollParent } from "../../../hooks/use-scroll-parent";
import { cn } from "../../../lib/utils";

interface StickyColumnLabelProps {
  /**
   * Additional className for header items (passed via cn)
   */
  className?: string;

  /**
   * Column header renderer
   */
  columnHeader?: (groupName: string, count: number) => ReactNode;

  /**
   * Column width in pixels
   */
  columnWidthPx: number;

  /**
   * Reference to the board container element (for visibility bottom-edge check)
   */
  containerRef: React.RefObject<HTMLDivElement | null>;

  /**
   * Whether sticky header is enabled
   */
  enabled: boolean;

  /**
   * Column background class getter
   */
  getColumnBgClass?: (groupName: string) => string | undefined;

  /**
   * Groups to render in the header
   */
  groups: Array<{
    key: string;
    count: number;
    displayCount?: string;
  }>;

  /**
   * Reference to the original header element (for visibility top-edge check)
   */
  headerRef: React.RefObject<HTMLDivElement | null>;

  /**
   * Offset from top of scroll container
   */
  offset?: number;

  /**
   * Register a scroll container with the board-level scroll sync.
   * Returns a cleanup function.
   */
  registerScroll: (el: HTMLElement) => () => void;
}

/**
 * StickyColumnLabel - Sticky header for board column labels.
 * Uses position: sticky for vertical sticking.
 * Horizontal scroll is synced via the board-level scroll sync.
 */
export function StickyColumnLabel({
  groups,
  columnWidthPx,
  columnHeader,
  getColumnBgClass,
  enabled,
  headerRef,
  containerRef,
  offset = 0,
  className,
  registerScroll,
}: StickyColumnLabelProps) {
  const stickyHeaderScrollRef = useRef<HTMLDivElement>(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);

  const getScrollParent = useScrollParent();

  // Visibility check: show sticky header when original header scrolls past threshold
  const handleScrollLogic = useCallback(() => {
    const headerElement = headerRef.current;
    const containerElement = containerRef.current;
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
  }, [headerRef, containerRef, offset, getScrollParent]);

  // Visibility listeners (vertical scroll + resize)
  useEffect(() => {
    if (!enabled) {
      setShowStickyHeader(false);
      return;
    }

    const containerElement = containerRef.current;
    if (!containerElement) {
      return;
    }

    // Initial check
    handleScrollLogic();

    // Resize observer on board container
    const resizeObserver = new ResizeObserver(handleScrollLogic);
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
  }, [enabled, containerRef, handleScrollLogic, getScrollParent]);

  // Register sticky header's inner scroll element with board scroll sync
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
      {showStickyHeader && (
        <div
          className="overflow-x-auto bg-background [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          ref={stickyHeaderScrollRef}
        >
          <div className="flex min-w-fit gap-4">
            {groups.map((group) => (
              <div
                className={cn(
                  "shrink-0 rounded-t-lg p-2",
                  className,
                  getColumnBgClass?.(group.key) || "bg-muted/30"
                )}
                key={group.key}
                style={{ width: columnWidthPx }}
              >
                {columnHeader ? (
                  columnHeader(group.key, group.count)
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{group.key}</span>
                    <span className="text-muted-foreground text-xs">
                      {group.displayCount ?? group.count}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
