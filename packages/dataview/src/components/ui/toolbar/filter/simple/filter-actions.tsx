"use client";

import { ListFilterIcon, MoreHorizontalIcon, TrashIcon } from "lucide-react";
import { useAdvanceFilterBuilder } from "../../../../../hooks/use-advance-filter-builder";
import { cn } from "../../../../../lib/utils";
import { Button } from "../../../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../dropdown-menu";

interface FilterActionsProps {
  /** Additional class names */
  className?: string;
  /** Callback to add this filter to advanced filter */
  onAddToAdvanced?: () => void;
  /** Callback to remove this filter */
  onRemove: () => void;
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
        render={<Button className={cn("size-6", className)} variant="ghost" />}
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
