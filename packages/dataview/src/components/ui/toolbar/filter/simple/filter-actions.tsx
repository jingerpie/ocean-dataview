"use client";

import { useAdvanceFilterBuilder } from "@ocean-dataview/dataview/hooks/use-advance-filter-builder";
import { ListFilterIcon, MoreHorizontalIcon, TrashIcon } from "lucide-react";
import { Button } from "../../../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../dropdown-menu";

interface FilterActionsProps {
  /** Callback to remove this filter */
  onRemove: () => void;
  /** Callback to add this filter to advanced filter */
  onAddToAdvanced?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * Actions menu for simple filter chips.
 * Shows Delete and optionally Add to advanced filter.
 */
export function FilterActions({
  onRemove,
  onAddToAdvanced,
  className,
}: FilterActionsProps) {
  const openAdvanceFilterBuilder = useAdvanceFilterBuilder((s) => s.open);

  const handleAddToAdvanced = () => {
    onAddToAdvanced?.();
    openAdvanceFilterBuilder();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button className={className} size="icon-sm" variant="ghost" />}
      >
        <MoreHorizontalIcon />
        <span className="sr-only">Actions</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto" side="bottom">
        <DropdownMenuItem onClick={onRemove} variant="destructive">
          <TrashIcon />
          Delete filter
        </DropdownMenuItem>
        {onAddToAdvanced && (
          <DropdownMenuItem onClick={handleAddToAdvanced}>
            <ListFilterIcon />
            Add to advanced filter
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { FilterActionsProps };
