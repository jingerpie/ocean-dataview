"use client";

import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { Table } from "@tanstack/react-table";
import { type ReactNode, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

interface DataActionBarProps<TData> {
  /**
   * TanStack Table instance (for TableView)
   * Optional - if not provided, use selectedCount and onClearSelection
   */
  table?: Table<TData>;

  /**
   * Selected count (for ListView or custom implementations)
   */
  selectedCount?: number;

  /**
   * Clear selection callback (for ListView or custom implementations)
   */
  onClearSelection?: () => void;

  /**
   * Visibility control
   * If not provided, auto-calculates from table or selectedCount
   */
  visible?: boolean;

  /**
   * Portal container element
   * Defaults to document.body
   */
  container?: Element | DocumentFragment | null;

  /**
   * Child components (action buttons, selection info, etc.)
   */
  children?: ReactNode;

  /**
   * Additional class names
   */
  className?: string;
}

/**
 * DataActionBar - Floating action bar that appears when items are selected
 * Works with both TanStack Table (TableView) and custom selection (ListView)
 *
 * Features:
 * - Renders via React Portal at bottom center
 * - Animated slide-up with motion
 * - Escape key to clear selection
 * - Flexible API for different view types
 */
export function DataActionBar<TData>({
  table,
  selectedCount: selectedCountProp,
  onClearSelection,
  visible: visibleProp,
  container: containerProp,
  children,
  className,
}: DataActionBarProps<TData>) {
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  // Handle Escape key to clear selection
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (table) {
          table.toggleAllRowsSelected(false);
        } else if (onClearSelection) {
          onClearSelection();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [table, onClearSelection]);

  const container =
    containerProp ?? (mounted ? globalThis.document?.body : null);

  if (!container) {
    return null;
  }

  // Auto-calculate visibility from table or selectedCount
  const selectedCount = table
    ? table.getFilteredSelectedRowModel().rows.length
    : (selectedCountProp ?? 0);

  const visible = visibleProp ?? selectedCount > 0;

  return createPortal(
    visible && (
      <div
        aria-orientation="horizontal"
        className={cn(
          "fixed inset-x-0 bottom-8 z-50 mx-auto flex w-fit flex-wrap items-center justify-center gap-3 rounded-lg border bg-background p-3 text-foreground shadow-md transition-all duration-200 ease-in-out",
          visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
          className
        )}
        role="toolbar"
      >
        {children}
      </div>
    ),
    container
  );
}
