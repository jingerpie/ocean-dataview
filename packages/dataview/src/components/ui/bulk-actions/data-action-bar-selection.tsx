"use client";

import type { Table } from "@tanstack/react-table";
import { XIcon } from "lucide-react";
import { useCallback } from "react";
import { Button } from "../button";
import { Separator } from "../separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

interface DataActionBarSelectionProps<TData> {
  /**
   * Clear selection callback (for ListView or custom implementations)
   */
  onClearSelection?: () => void;

  /**
   * Selected count (for ListView or custom implementations)
   */
  selectedCount?: number;
  /**
   * TanStack Table instance (for TableView)
   * Optional - if not provided, use selectedCount and onClearSelection
   */
  table?: Table<TData>;
}

/**
 * DataActionBarSelection - Shows selection count with clear button
 * Works with both TanStack Table and custom selection state
 */
export function DataActionBarSelection<TData>({
  table,
  selectedCount: selectedCountProp,
  onClearSelection,
}: DataActionBarSelectionProps<TData>) {
  const selectedCount = table
    ? table.getFilteredSelectedRowModel().rows.length
    : (selectedCountProp ?? 0);

  const handleClearSelection = useCallback(() => {
    if (table) {
      table.toggleAllRowsSelected(false);
    } else if (onClearSelection) {
      onClearSelection();
    }
  }, [table, onClearSelection]);

  return (
    <div className="flex h-9 items-center rounded-md border pr-2 pl-3">
      <span className="whitespace-nowrap text-sm">
        {selectedCount} selected
      </span>
      <Separator className="mr-1 ml-2 h-4" orientation="vertical" />
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              onClick={handleClearSelection}
              size="icon"
              variant="ghost"
            />
          }
        >
          <XIcon />
        </TooltipTrigger>
        <TooltipContent
          className="flex items-center gap-2 border bg-accent px-2 py-1 font-semibold text-foreground"
          sideOffset={10}
        >
          <p>Clear selection</p>
          <kbd className="select-none rounded border bg-background px-1.5 py-px font-mono font-normal text-[0.7rem] text-foreground shadow-sm">
            <abbr className="no-underline" title="Escape">
              Esc
            </abbr>
          </kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
