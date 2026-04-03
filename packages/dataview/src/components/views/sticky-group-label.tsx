"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useDebouncedCallback } from "../../hooks/use-debounced-callback";
import { useScrollParent } from "../../hooks/use-scroll-parent";
import { cn } from "../../lib/utils";

const RESIZE_DEBOUNCE_MS = 150;

interface StickyGroupLabelProps {
  /**
   * Content to render in the label
   */
  children: ReactNode;

  /**
   * Additional className for the label
   */
  className?: string;

  /**
   * Reference to the group container element
   */
  containerRef: React.RefObject<HTMLElement | null>;

  /**
   * Offset from top of viewport (e.g., navbar height)
   */
  offset?: number;
}

/**
 * StickyGroupLabel - Portal-based sticky label for group headers
 * Left-aligned, sticky-left on horizontal scroll, sticky-top on vertical scroll
 */
export function StickyGroupLabel({
  children,
  className,
  offset = 0,
  containerRef,
}: StickyGroupLabelProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [headerRect, setHeaderRect] = useState<{
    width: number;
    height: number;
    left: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  // Scroll handler logic
  const handleScrollLogic = useCallback(() => {
    const headerElement = headerRef.current;
    const containerElement = containerRef.current;
    if (!(headerElement && containerElement)) {
      return;
    }

    const hRect = headerElement.getBoundingClientRect();
    const contRect = containerElement.getBoundingClientRect();

    // Check if header top is above the sticky threshold
    // and container bottom is still below the threshold + header height
    const shouldShow =
      hRect.top < offset && contRect.bottom > offset + hRect.height;

    setShowStickyHeader(shouldShow);

    if (shouldShow) {
      setHeaderRect({
        width: hRect.width,
        height: hRect.height,
        left: Math.max(0, hRect.left),
      });
    }
  }, [offset, containerRef]);

  // Debounced resize handler
  const debouncedResizeHandler = useDebouncedCallback(
    handleScrollLogic,
    RESIZE_DEBOUNCE_MS
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const getScrollParent = useScrollParent();

  useEffect(() => {
    const headerElement = headerRef.current;
    const containerElement = containerRef.current;
    if (!(headerElement && containerElement)) {
      return;
    }

    // Initial check
    handleScrollLogic();

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      debouncedResizeHandler();
    });

    resizeObserver.observe(containerElement);

    const scrollParent = getScrollParent(containerElement);
    scrollParent.addEventListener("scroll", handleScrollLogic, {
      passive: true,
    });

    return () => {
      resizeObserver.disconnect();
      scrollParent.removeEventListener("scroll", handleScrollLogic);
    };
  }, [
    containerRef,
    handleScrollLogic,
    debouncedResizeHandler,
    getScrollParent,
  ]);

  // Render the original header in place - sticky left for horizontal scroll
  const originalHeader = (
    <div
      className={cn("sticky left-0 z-10 w-fit bg-background", className)}
      ref={headerRef}
    >
      {children}
    </div>
  );

  // Don't render portal if not enabled, not mounted, or conditions not met
  if (!(mounted && showStickyHeader && headerRect)) {
    return originalHeader;
  }

  // Render the sticky header using a portal - fixed at top, full width background
  return (
    <>
      {originalHeader}
      {createPortal(
        <div
          className={cn("fixed right-0 z-40 bg-background", className)}
          ref={stickyHeaderRef}
          style={{
            top: offset,
            left: headerRect.left,
          }}
        >
          {children}
        </div>,
        document.body
      )}
    </>
  );
}
