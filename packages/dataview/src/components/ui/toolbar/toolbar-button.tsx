"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ocean-dataview/dataview/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";
import type * as React from "react";

interface ToolbarButtonProps {
  /** Icon to display */
  icon: React.ReactNode;
  /** Button label */
  label: string;
  /** Whether controls are active (shows filled/highlighted style) */
  isActive?: boolean;
  /** Click handler (used when no dropdown) */
  onClick?: () => void;
  /** Dropdown content (if provided, button opens popover) */
  dropdownContent?: React.ReactNode;
  /** Whether the dropdown is open (controlled) */
  open?: boolean;
  /** Callback when dropdown open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Popover alignment */
  align?: "start" | "center" | "end";
  /** Additional class names */
  className?: string;
}

/**
 * Reusable toolbar button with optional dropdown.
 * Shows filled/highlighted style when isActive is true.
 */
export function ToolbarButton({
  icon,
  label,
  isActive = false,
  onClick,
  dropdownContent,
  open,
  onOpenChange,
  align = "start",
  className,
}: ToolbarButtonProps) {
  // If dropdown content provided, render with popover
  if (dropdownContent) {
    return (
      <Popover onOpenChange={onOpenChange} open={open}>
        <PopoverTrigger
          render={
            <Button
              className={className}
              size="sm"
              variant={isActive ? "secondary" : "ghost"}
            />
          }
        >
          {icon}
          <span>{label}</span>
          <ChevronDownIcon className="size-3.5 opacity-50" />
        </PopoverTrigger>
        <PopoverContent align={align}>{dropdownContent}</PopoverContent>
      </Popover>
    );
  }

  // Simple button without dropdown
  return (
    <Button
      className={className}
      onClick={onClick}
      size="sm"
      variant={isActive ? "secondary" : "ghost"}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}

export type { ToolbarButtonProps };
