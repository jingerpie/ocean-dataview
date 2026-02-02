"use client";

import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { PropertyMeta } from "@ocean-dataview/dataview/types";
import type {
  WhereExpression,
  WhereNode,
  WhereRule,
} from "@ocean-dataview/shared/types";
import { isWhereRule } from "@ocean-dataview/shared/types";
import {
  addCondition,
  addGroup,
  changeLogic,
  duplicateItem,
  getFilterItems,
  getFilterLogic,
  removeItem,
  updateCondition,
  wrapInGroup,
} from "@ocean-dataview/shared/utils";
import { AddFilterButton } from "./add-filter-button";
import { FilterActions } from "./filter-actions";
import { FilterRule } from "./filter-rule";
import { LogicPicker } from "./logic-picker";

interface FilterGroupProps {
  /** The compound filter (AND/OR group) */
  filter: WhereExpression;
  /** Available properties to filter on */
  properties: readonly PropertyMeta[];
  /** Current nesting level (0 = root, 1, 2) */
  level: 0 | 1 | 2;
  /** Whether this is the first item in parent (for connector display) */
  isFirst: boolean;
  /** Whether this is the second item in parent (for dropdown display) */
  isSecond?: boolean;
  /** Callback when filter changes */
  onChange: (filter: WhereExpression) => void;
  /** Callback to remove this group (not available at root) */
  onRemove?: () => void;
  /** Callback to duplicate this group (for nested groups) */
  onDuplicate?: () => void;
  /** Callback to unwrap this group - replace with its single item (for nested groups) */
  onUnwrap?: (item: WhereNode) => void;
  /** Callback to wrap this group in another group (for nested groups) */
  onWrapInGroup?: () => void;
  /** Callback when this group's connector logic changes (for parent) */
  onConnectorLogicChange?: (logic: "and" | "or") => void;
  /** The connector logic from parent (how this group connects to siblings) */
  connectorLogic?: "and" | "or";
  /** Additional class names */
  className?: string;
}

/**
 * Recursive filter group component.
 * Renders filter conditions and nested groups with AND/OR logic.
 */
export function FilterGroup({
  filter,
  properties,
  level,
  isFirst,
  isSecond = false,
  onChange,
  onRemove,
  onDuplicate,
  onUnwrap,
  onWrapInGroup,
  onConnectorLogicChange,
  connectorLogic = "and",
  className,
}: FilterGroupProps) {
  const logic = getFilterLogic(filter);
  const items = getFilterItems(filter);

  // Can add nested groups if not at max depth (level 2)
  const canAddGroup = level < 2;

  // Handle unwrap - only works when group has exactly 1 item
  const handleUnwrap = () => {
    const firstItem = items[0];
    if (items.length === 1 && firstItem && onUnwrap) {
      onUnwrap(firstItem);
    }
  };

  // Handle adding a new rule
  const handleAddRule = (rule: WhereRule) => {
    onChange(addCondition(filter, [], rule));
  };

  // Handle adding a new group
  const handleAddGroup = () => {
    // Find first property to use as default
    const defaultProperty = properties[0]?.id ? String(properties[0].id) : "";
    onChange(addGroup(filter, [], "and", defaultProperty));
  };

  // Handle updating a rule at index
  const handleUpdateRule = (index: number, rule: WhereRule) => {
    onChange(updateCondition(filter, [index], rule));
  };

  // Handle removing an item at index
  // Preserves empty group structure (doesn't auto-remove when empty)
  const handleRemoveItem = (index: number) => {
    const result = removeItem(filter, [index]);
    onChange(result);
  };

  // Handle duplicating an item at index
  const handleDuplicateItem = (index: number) => {
    onChange(duplicateItem(filter, [index]));
  };

  // Handle wrapping an item in a group at index
  const handleWrapInGroup = (index: number) => {
    onChange(wrapInGroup(filter, [index], "and"));
  };

  // Handle changing the group's logic
  const handleLogicChange = (newLogic: "and" | "or") => {
    onChange(changeLogic(filter, [], newLogic));
  };

  // Handle nested group changes
  const handleNestedGroupChange = (
    index: number,
    newGroup: WhereExpression
  ) => {
    // Update the nested group at this index
    const newItems = [...items];
    newItems[index] = newGroup;
    onChange(logic === "and" ? { and: newItems } : { or: newItems });
  };

  // Container styles based on level
  const containerStyles = cn(
    "flex flex-1 flex-col gap-1",
    level === 1 && "rounded-lg border border-border/90 bg-muted/30 p-2",
    level === 2 && "rounded-md border border-border/80 bg-muted/20 p-2"
  );

  // Is this a nested group?
  const isNestedGroup = level > 0;

  // Determine unwrap availability (can unwrap if group has exactly 1 item)
  const canUnwrap = items.length === 1;

  // Check if wrapping would exceed max level (wrapping shifts all content down 1 level)
  // Only allow wrap if no nested groups exist (otherwise they'd exceed level 2)
  const hasNestedGroups = items.some((item) => !isWhereRule(item));
  const canWrapThisGroup = level < 2 && !hasNestedGroups;

  // Wrapper for nested groups (includes connector + container + actions button)
  if (isNestedGroup) {
    return (
      <div className={cn("flex items-start gap-1.5", className)}>
        {/* Logic Picker */}
        <LogicPicker
          isFirst={isFirst}
          isSecond={isSecond}
          logic={connectorLogic}
          onLogicChange={onConnectorLogicChange ?? (() => undefined)}
        />

        {/* Group container */}
        <div className={containerStyles}>
          {/* Render items */}
          <div className="flex flex-col gap-2">
            {items.map((item, index) => {
              if (isWhereRule(item)) {
                return (
                  <FilterRule
                    canWrapInGroup={level < 2}
                    isFirst={index === 0}
                    isSecond={index === 1}
                    key={index}
                    logic={logic}
                    onDuplicate={() => handleDuplicateItem(index)}
                    onLogicChange={handleLogicChange}
                    onRemove={() => handleRemoveItem(index)}
                    onRuleChange={(rule) => handleUpdateRule(index, rule)}
                    onWrapInGroup={() => handleWrapInGroup(index)}
                    properties={properties}
                    rule={item}
                  />
                );
              }

              // Nested group
              const nextLevel = Math.min(level + 1, 2) as 0 | 1 | 2;
              return (
                <FilterGroup
                  connectorLogic={logic}
                  filter={item}
                  isFirst={index === 0}
                  isSecond={index === 1}
                  key={index}
                  level={nextLevel}
                  onChange={(newGroup) =>
                    handleNestedGroupChange(index, newGroup)
                  }
                  onConnectorLogicChange={(newLogic) => {
                    handleLogicChange(newLogic);
                  }}
                  onDuplicate={() => handleDuplicateItem(index)}
                  onRemove={() => handleRemoveItem(index)}
                  onUnwrap={(unwrappedItem) => {
                    const newItems = [...items];
                    newItems[index] = unwrappedItem;
                    onChange(
                      logic === "and" ? { and: newItems } : { or: newItems }
                    );
                  }}
                  onWrapInGroup={() => handleWrapInGroup(index)}
                  properties={properties}
                />
              );
            })}
          </div>

          {/* Add filter button */}
          <AddFilterButton
            canAddGroup={canAddGroup}
            className="justify-start"
            onAddGroup={handleAddGroup}
            onAddRule={handleAddRule}
            properties={properties}
          />
        </div>

        {/* Group actions menu (next to the group) */}
        {onRemove && (
          <FilterActions
            onDuplicate={onDuplicate ?? (() => undefined)}
            onRemove={onRemove}
            onUnwrap={canUnwrap ? handleUnwrap : undefined}
            onWrapInGroup={
              canWrapThisGroup
                ? (onWrapInGroup ?? (() => undefined))
                : undefined
            }
          />
        )}
      </div>
    );
  }

  // Root level group (no wrapper needed)
  return (
    <div className={cn(containerStyles, className)}>
      {/* Render items - only when there are items */}
      {items.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 pl-2">
          {items.map((item, index) => {
            if (isWhereRule(item)) {
              return (
                <FilterRule
                  canWrapInGroup={level < 2}
                  isFirst={index === 0}
                  isSecond={index === 1}
                  key={index}
                  logic={logic}
                  onDuplicate={() => handleDuplicateItem(index)}
                  onLogicChange={handleLogicChange}
                  onRemove={() => handleRemoveItem(index)}
                  onRuleChange={(rule) => handleUpdateRule(index, rule)}
                  onWrapInGroup={() => handleWrapInGroup(index)}
                  properties={properties}
                  rule={item}
                />
              );
            }

            // Nested group
            const nextLevel = Math.min(level + 1, 2) as 0 | 1 | 2;
            return (
              <FilterGroup
                connectorLogic={logic}
                filter={item}
                isFirst={index === 0}
                isSecond={index === 1}
                key={index}
                level={nextLevel}
                onChange={(newGroup) =>
                  handleNestedGroupChange(index, newGroup)
                }
                onConnectorLogicChange={(newLogic) => {
                  // This changes how THIS group connects to siblings
                  // which means changing the parent's logic
                  handleLogicChange(newLogic);
                }}
                onDuplicate={() => handleDuplicateItem(index)}
                onRemove={() => handleRemoveItem(index)}
                onUnwrap={(unwrappedItem) => {
                  // Replace the group with its single item
                  const newItems = [...items];
                  newItems[index] = unwrappedItem;
                  onChange(
                    logic === "and" ? { and: newItems } : { or: newItems }
                  );
                }}
                onWrapInGroup={() => handleWrapInGroup(index)}
                properties={properties}
              />
            );
          })}
        </div>
      )}

      {/* Add filter button */}
      <AddFilterButton
        canAddGroup={canAddGroup}
        className="justify-start"
        onAddGroup={handleAddGroup}
        onAddRule={handleAddRule}
        properties={properties}
      />
    </div>
  );
}

export type { FilterGroupProps };
