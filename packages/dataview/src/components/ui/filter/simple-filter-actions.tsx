"use client";

import { ListFilterIcon, MoreHorizontalIcon, TrashIcon } from "lucide-react";
import { useCallback } from "react";
import { useAdvanceFilterBuilder, useFilterParams } from "../../../hooks";
import { cn } from "../../../lib/utils";
import {
  isWhereRule,
  type WhereExpression,
  type WhereRule,
} from "../../../types";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../dropdown-menu";

interface SimpleFilterActionsProps {
  /** Additional class names */
  className?: string;
  /** Additional callback after adding to advanced filter */
  onAddToAdvanced?: () => void;
  /** Additional callback after removing filter */
  onRemove?: () => void;
  /** The filter rule (required for internal handling) */
  rule: WhereRule;
}

/**
 * Actions menu for simple filter chips.
 *
 * Handles internally:
 * - Delete: Removes this rule from filter array
 * - Add to advanced: Moves rule to advanced filter group, opens builder
 *
 * Optional callbacks are for additional actions after defaults.
 */
export function SimpleFilterActions({
  rule,
  onRemove,
  onAddToAdvanced,
  className,
}: SimpleFilterActionsProps) {
  const { filter, setFilter, removeFilter } = useFilterParams();
  const openAdvanceFilterBuilder = useAdvanceFilterBuilder((s) => s.open);

  // Remove this rule from filter array - uses immediate removeFilter
  const handleRemove = useCallback(() => {
    removeFilter(rule.property);
    onRemove?.();
  }, [removeFilter, rule.property, onRemove]);

  // Move rule to advanced filter, then open builder
  const handleAddToAdvanced = useCallback(() => {
    if (!filter) {
      return;
    }

    // Find existing advanced filter or create new one
    const advancedIndex = filter.findIndex((node) => !isWhereRule(node));
    const items = filter.filter(
      (node) => !isWhereRule(node) || node.property !== rule.property
    );

    if (advancedIndex === -1) {
      // Create new advanced filter with this rule
      items.unshift({ and: [rule] });
    } else {
      // Add to existing advanced filter
      const existing = filter[advancedIndex] as WhereExpression;
      const advancedItems = existing.and ?? existing.or ?? [];
      const newAdvanced: WhereExpression = existing.and
        ? { and: [...advancedItems, rule] }
        : { or: [...advancedItems, rule] };
      // Find the correct index in items (may have shifted due to filtered rule)
      const advancedIndexInItems = items.findIndex(
        (node) => !isWhereRule(node)
      );
      if (advancedIndexInItems !== -1) {
        items[advancedIndexInItems] = newAdvanced;
      }
    }

    setFilter(items.length > 0 ? items : null);
    openAdvanceFilterBuilder();
    onAddToAdvanced?.();
  }, [filter, setFilter, rule, openAdvanceFilterBuilder, onAddToAdvanced]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button className={cn("size-6", className)} variant="ghost" />}
      >
        <MoreHorizontalIcon />
        <span className="sr-only">Actions</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto" side="bottom">
        <DropdownMenuItem onClick={handleRemove} variant="destructive">
          <TrashIcon />
          Delete filter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAddToAdvanced}>
          <ListFilterIcon />
          Add to advanced filter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { SimpleFilterActionsProps };
