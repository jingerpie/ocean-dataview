"use client";

import { ChevronDownIcon, PlusIcon, SortAscIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "../../button";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover";

interface SortTriggerProps {
  /** Content to show in the popover (Picker, Editor, or BulkEditor) */
  children: ReactNode;
  /** Number of active sorts (for "count" variant) */
  count?: number;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Controlled open state */
  open?: boolean;
  /**
   * Trigger variant:
   * - `count` - Shows sort count: "3 sorts ▾"
   * - `add` - Shows add button: "+ Sort"
   * - `icon` - Shows icon only: "↕"
   */
  variant?: "count" | "add" | "icon";
}

/**
 * Sort trigger button that opens a popover with sort content.
 *
 * This is a shell component - pass any sort content as children:
 * - SortPicker (for adding first sort)
 * - SortEditor (for editing single sort)
 * - SortBulkEditor (for managing all sorts)
 *
 * Variants:
 * - `count` - [↕ 3 sorts ▾] - use when sorts exist
 * - `add` - [+ Sort] - use when no sorts exist
 * - `icon` - [↕] - compact icon-only button
 */
function SortTrigger({
  children,
  count = 0,
  variant = "count",
  open: controlledOpen,
  onOpenChange,
}: SortTriggerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled
    ? (onOpenChange ?? setUncontrolledOpen)
    : setUncontrolledOpen;

  const renderTrigger = () => {
    switch (variant) {
      case "add":
        return (
          <PopoverTrigger render={<Button variant="outline" />}>
            <PlusIcon />
            <span>Sort</span>
          </PopoverTrigger>
        );

      case "icon":
        return (
          <PopoverTrigger render={<Button size="icon" variant="ghost" />}>
            <SortAscIcon />
          </PopoverTrigger>
        );

      default: {
        const sortText = count === 1 ? "1 sort" : `${count} sorts`;
        return (
          <PopoverTrigger
            render={
              <Button className="border-dashed" size="sm" variant="outline" />
            }
          >
            <SortAscIcon />
            <span>{sortText}</span>
            <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
          </PopoverTrigger>
        );
      }
    }
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      {renderTrigger()}
      <PopoverContent align="start" className="w-auto p-1">
        {children}
      </PopoverContent>
    </Popover>
  );
}

export { SortTrigger, type SortTriggerProps };
