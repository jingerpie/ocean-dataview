"use client";

import { CopyIcon, MoreHorizontalIcon, Repeat2, TrashIcon } from "lucide-react";
import { Button } from "../../../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../dropdown-menu";

interface FilterActionsProps {
  /** Callback to remove this item */
  onRemove: () => void;
  /** Callback to duplicate this item */
  onDuplicate: () => void;
  /** Callback to wrap this item in a group (shows "Wrap in group" if provided) */
  onWrapInGroup?: () => void;
  /** Callback to unwrap this group (shows "Unwrap group" if provided) */
  onUnwrap?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * Unified actions menu for filter rules and groups.
 * Shows Remove, Duplicate, and optionally Wrap/Unwrap actions.
 */
export function FilterActions({
  onRemove,
  onDuplicate,
  onWrapInGroup,
  onUnwrap,
  className,
}: FilterActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button className={className} size="icon" variant="ghost" />}
      >
        <MoreHorizontalIcon className="size-4" />
        <span className="sr-only">Actions</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuItem onClick={onRemove} variant="destructive">
          <TrashIcon className="size-4" />
          <span>Remove</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}>
          <CopyIcon className="size-4" />
          <span>Duplicate</span>
        </DropdownMenuItem>

        {onUnwrap && (
          <DropdownMenuItem onClick={onUnwrap}>
            <Repeat2 className="size-4" />
            <span>Unwrap group</span>
          </DropdownMenuItem>
        )}

        {onWrapInGroup && (
          <DropdownMenuItem onClick={onWrapInGroup}>
            <Repeat2 className="size-4" />
            <div className="flex flex-col">
              <span>Wrap in group</span>
              <span className="text-muted-foreground text-xs">
                Create a filter group around this
              </span>
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { FilterActionsProps };
