"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ocean-dataview/dataview/components/ui/popover";
import { useAdvanceFilterBuilder } from "@ocean-dataview/dataview/hooks";
import type { PropertyMeta } from "@ocean-dataview/dataview/types";
import type { WhereExpression, WhereNode } from "@ocean-dataview/shared/types";
import { ChevronDownIcon, ListFilterIcon, TrashIcon } from "lucide-react";
import { Separator } from "../../../separator";
import { FilterGroup } from "./filter-group";

interface AdvancedFilterChipProps {
  /** The compound filter */
  filter: WhereExpression;
  /** Available properties */
  properties: readonly PropertyMeta[];
  /** Callback when filter changes */
  onFilterChange: (filter: WhereNode | null) => void;
  /** Total number of rules in the filter */
  ruleCount: number;
}

/**
 * Advanced filter chip that opens the full filter builder.
 * Appearance: [≡ N rules ▾]
 *
 * Uses global Zustand store for popover state coordination with toolbar buttons.
 */
export function AdvancedFilterChip({
  filter,
  properties,
  onFilterChange,
  ruleCount,
}: AdvancedFilterChipProps) {
  const { isOpen, setOpen } = useAdvanceFilterBuilder();

  const ruleText = ruleCount === 1 ? "1 rule" : `${ruleCount} rules`;

  // Handle filter changes from FilterGroup
  const handleFilterChange = (newFilter: WhereExpression) => {
    onFilterChange(newFilter);
  };

  // Handle deleting all filters
  const handleDeleteFilter = () => {
    onFilterChange(null);
    setOpen(false);
  };

  return (
    <Popover onOpenChange={setOpen} open={isOpen}>
      <PopoverTrigger render={<Button size="sm" variant="secondary" />}>
        <ListFilterIcon className="size-3" />
        <span>{ruleText}</span>
        <ChevronDownIcon className="size-3" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-64 p-1">
        <div className="flex flex-col gap-1">
          {/* Filter Content */}
          <FilterGroup
            filter={filter}
            isFirst={true}
            level={0}
            onChange={handleFilterChange}
            onRemove={handleDeleteFilter}
            properties={properties}
          />

          <Separator />

          {/* Delete Filter */}
          <Button
            className="justify-start"
            onClick={handleDeleteFilter}
            size="sm"
            variant="ghost-destructive"
          >
            <TrashIcon />
            <span>Delete filter</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export type { AdvancedFilterChipProps };
