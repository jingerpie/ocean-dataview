"use client";

import { TrashIcon } from "lucide-react";
import type { WhereExpression } from "../../../types/filter.type";
import type { PropertyMeta } from "../../../types/property.type";
import { Button } from "../button";
import { Separator } from "../separator";
import { FilterGroup } from "./advanced-filter-group";

interface AdvancedFilterEditorProps {
  /** The compound filter (AND/OR group) */
  filter: WhereExpression;
  /** Callback when delete all is clicked */
  onDeleteAll?: () => void;
  /** Callback when filter changes */
  onFilterChange: (filter: WhereExpression) => void;
  /** Available properties */
  properties: readonly PropertyMeta[];
}

/**
 * Advanced filter editor - popover content for managing nested filter groups.
 *
 * Structure:
 * - FilterGroup (recursive AND/OR groups)
 * - Delete filter button
 *
 * Used inside AdvancedFilterChip's popover content.
 */
function AdvancedFilterEditor({
  filter,
  properties,
  onFilterChange,
  onDeleteAll,
}: AdvancedFilterEditorProps) {
  const handleDeleteFilter = () => {
    onDeleteAll?.();
  };

  return (
    <div className="flex flex-col gap-1 p-1">
      {/* Filter Content */}
      <FilterGroup
        filter={filter}
        isFirst={true}
        level={0}
        onChange={onFilterChange}
        onRemove={handleDeleteFilter}
        properties={properties}
      />

      <Separator />

      {/* Delete Filter */}
      <Button
        className="justify-start"
        onClick={handleDeleteFilter}
        variant="destructive"
      >
        <TrashIcon />
        <span>Delete filter</span>
      </Button>
    </div>
  );
}

export { AdvancedFilterEditor, type AdvancedFilterEditorProps };
