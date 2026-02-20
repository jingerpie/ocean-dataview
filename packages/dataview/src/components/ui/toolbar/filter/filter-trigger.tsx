"use client";

import { ChevronDownIcon, ListFilterIcon, PlusIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "../../button";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover";

interface FilterTriggerProps {
  /** Content to show in the popover (Picker, Editor, etc.) */
  children: ReactNode;
  /** Number of active filter rules (for "count" variant) */
  count?: number;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Controlled open state */
  open?: boolean;
  /**
   * Trigger variant:
   * - `count` - Shows rule count: "3 rules ▾"
   * - `add` - Shows add button: "+ Filter"
   * - `icon` - Shows icon only: "≡"
   */
  variant?: "count" | "add" | "icon";
}

/**
 * Filter trigger button that opens a popover with filter content.
 *
 * This is a shell component - pass any filter content as children:
 * - FilterPicker (for adding new filter)
 * - AdvancedFilterEditor (for managing advanced filter)
 *
 * For simple filter chips, use SimpleFilterChip directly as it needs
 * property-specific trigger rendering.
 *
 * Variants:
 * - `count` - [≡ 3 rules ▾] - use for advanced filter chip
 * - `add` - [+ Filter] - use for add filter button
 * - `icon` - [≡] - compact icon-only button
 */
function FilterTrigger({
  children,
  count = 0,
  variant = "count",
  open: controlledOpen,
  onOpenChange,
}: FilterTriggerProps) {
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
          <PopoverTrigger render={<Button size="sm" variant="ghost" />}>
            <PlusIcon />
            <span>Filter</span>
          </PopoverTrigger>
        );

      case "icon":
        return (
          <PopoverTrigger render={<Button size="icon" variant="ghost" />}>
            <ListFilterIcon />
          </PopoverTrigger>
        );

      default: {
        const ruleText = count === 1 ? "1 rule" : `${count} rules`;
        return (
          <PopoverTrigger
            render={
              <Button className="border-dashed" size="sm" variant="outline" />
            }
          >
            <ListFilterIcon />
            <span>{ruleText}</span>
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

export { FilterTrigger, type FilterTriggerProps };
