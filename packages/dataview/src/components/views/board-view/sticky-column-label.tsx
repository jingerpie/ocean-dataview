"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useDebouncedCallback } from "../../../hooks/use-debounced-callback";
import { cn } from "../../../lib/utils";

const RESIZE_DEBOUNCE_MS = 150;

interface StickyColumnLabelProps {
  /**
   * Groups to render in the header
   */
  groups: Array<{
    key: string;
    count: number;
    displayCount?: string;
  }>;

  /**
   * Column width in pixels
   */
  columnWidthPx: number;

  /**
   * Column header renderer
   */
  columnHeader?: (groupName: string, count: number) => ReactNode;

  /**
   * Column background class getter
   */
  getColumnBgClass?: (groupName: string) => string | undefined;

  /**
   * Whether sticky header is enabled
   */
  enabled: boolean;

  /**
   * Reference to the original header element
   */
  headerRef: React.RefObject<HTMLDivElement | null>;

  /**
   * Reference to the scroll container element
   */
  containerRef: React.RefObject<HTMLDivElement | null>;

  /**
   * Offset from top of viewport (e.g., navbar height)
   */
  offset?: number;

  /**
   * Additional className for header items (passed via cn)
   */
  className?: string;
}

/**
 * StickyColumnLabel - Portal-based sticky header for board column labels
 * Syncs horizontal scroll with the main board content
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
}: StickyColumnLabelProps) {
  const stickyHeaderScrollRef = useRef<HTMLDivElement>(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  // Shared scroll state for instant synchronization
  const scrollStateRef = useRef({ scrollLeft: 0, isUpdating: false });

  // Scroll handler logic (reads from refs)
  const handleScrollLogic = useCallback(() => {
    const headerElement = headerRef.current;
    const containerElement = containerRef.current;
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
  }, [headerRef, containerRef, offset]);

  // Debounced resize handler (150ms)
  const debouncedResizeHandler = useDebouncedCallback(
    handleScrollLogic,
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

    const headerElement = headerRef.current;
    const containerElement = containerRef.current;
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

      // Reset flag synchronously
      scrollStateRef.current.isUpdating = false;
    };

    // Initial setup
    handleScrollLogic();

    // Handle horizontal scroll in container
    const handleContainerScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      updateScrollPosition(target.scrollLeft);
    };

    // Update on resize - use debounced handler
    const resizeObserver = new ResizeObserver(() => {
      debouncedResizeHandler();
    });

    resizeObserver.observe(containerElement);

    window.addEventListener("scroll", handleScrollLogic, { passive: true });
    containerElement.addEventListener("scroll", handleContainerScroll, {
      passive: true,
    });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", handleScrollLogic);
      containerElement.removeEventListener("scroll", handleContainerScroll);
    };
  }, [
    enabled,
    headerRef,
    containerRef,
    handleScrollLogic,
    debouncedResizeHandler,
  ]);

  // Effect for sticky header scroll synchronization
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const stickyScrollElement = stickyHeaderScrollRef.current;
    const containerElement = containerRef.current;

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
  }, [enabled, showStickyHeader, containerRef]);

  // Don't render anything if not enabled, not mounted, or conditions not met
  if (!(enabled && mounted && showStickyHeader && containerRect)) {
    return null;
  }

  // Render the sticky header using a portal
  return createPortal(
    <div
      className="fixed z-40 bg-background"
      style={{
        top: offset,
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
    </div>,
    document.body
  );
}
