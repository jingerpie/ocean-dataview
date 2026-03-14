"use client";

import { ChevronDownIcon, CopyPlusIcon, PlusIcon } from "lucide-react";
import { cn } from "../../../lib/utils";
import { createRuleFromProperty } from "../../../lib/utils/filter-variant";
import type { PropertyMeta, WhereRule } from "../../../types";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../dropdown-menu";

interface AddFilterButtonProps {
  /** Whether adding a group is allowed (false at max depth) */
  canAddGroup: boolean;
  /** Additional class names */
  className?: string;
  /** Callback when a new group is added */
  onAddGroup: () => void;
  /** Callback when a new rule is added */
  onAddRule: (rule: WhereRule) => void;
  /** Available properties to filter on */
  properties: readonly PropertyMeta[];
}

/**
 * Button to add a new filter rule or group.
 *
 * - "Add filter rule" immediately creates a rule with the first property
 * - "Add filter group" creates a nested AND group
 * - User can change property afterward using PropertySelect in FilterRule
 */
export function AddFilterButton({
  properties,
  canAddGroup,
  onAddRule,
  onAddGroup,
  className,
}: AddFilterButtonProps) {
  // Create rule with first property as default
  const handleAddRule = () => {
    const firstProperty = properties[0];
    if (!firstProperty) {
      return;
    }

    onAddRule(createRuleFromProperty(firstProperty));
  };

  // When can add group, show dropdown with two options
  if (canAddGroup) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              className={cn(className, "text-muted-foreground!")}
              variant="ghost"
            >
              <PlusIcon />
              <span>Add filter rule</span>
              <ChevronDownIcon />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-auto">
          <DropdownMenuItem onClick={handleAddRule}>
            <PlusIcon className="size-4" />
            <span>Add filter rule</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onAddGroup}>
            <CopyPlusIcon className="size-4" />
            <div className="flex flex-col">
              <span>Add filter group</span>
              <span className="text-muted-foreground text-xs">
                A group to nest more filters
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // At max depth, just a simple button (no dropdown needed)
  return (
    <Button
      className={cn(className, "text-muted-foreground!")}
      onClick={handleAddRule}
      variant="ghost"
    >
      <PlusIcon />
      <span>Add filter rule</span>
    </Button>
  );
}

export type { AddFilterButtonProps };
