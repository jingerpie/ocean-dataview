"use client";

import {
  ButtonGroup,
  ButtonGroupText,
} from "@sparkyidea/ui/components/button-group";
import { Kbd } from "@sparkyidea/ui/components/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@sparkyidea/ui/components/tooltip";
import type { Table } from "@tanstack/react-table";
import { XIcon } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/registry/base-nova/ui/dataview-button";

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
    <ButtonGroup>
      <ButtonGroupText className="h-7 whitespace-nowrap">
        {selectedCount} selected
      </ButtonGroupText>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              onClick={handleClearSelection}
              size="icon-sm"
              variant="outline"
            />
          }
        >
          <XIcon />
        </TooltipTrigger>
        <TooltipContent className="flex items-center gap-2" sideOffset={10}>
          Clear selection
          <Kbd>Esc</Kbd>
        </TooltipContent>
      </Tooltip>
    </ButtonGroup>
  );
}
