"use client";

import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface StickyGroupLabelProps {
  /**
   * Sticky axis.
   * - "vertical": sticky top (for views without horizontal scroll, e.g., list/gallery)
   * - "horizontal": sticky left (for views inside overflow-x-auto, e.g., table/board)
   * @default "vertical"
   */
  axis?: "vertical" | "horizontal";

  /**
   * Content to render in the label
   */
  children: ReactNode;

  /**
   * Additional className for the label
   */
  className?: string;

  /**
   * Offset from top of scroll container (only used for vertical axis)
   */
  offset?: number;
}

/**
 * StickyGroupLabel - CSS sticky label for group headers.
 * Vertical: sticks to top during page scroll (list/gallery).
 * Horizontal: sticks to left during horizontal scroll (table/board inside overflow-x-auto).
 */
export function StickyGroupLabel({
  axis = "vertical",
  children,
  className,
  offset = 0,
}: StickyGroupLabelProps) {
  if (axis === "horizontal") {
    return (
      <div className={cn("sticky left-0 z-10 w-fit bg-background", className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn("sticky z-40 bg-background", className)}
      style={{ top: offset }}
    >
      {children}
    </div>
  );
}
