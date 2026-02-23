"use client";

import { ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { useGroupParams } from "../../../../hooks";
import type { PropertyMeta } from "../../../../types";
import { Command, CommandGroup, CommandItem, CommandList } from "../../command";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover";
import { GroupDirectionPicker } from "./group-direction-picker";

interface GroupEditorProps {
  /** Callback when "Group by" row is clicked (to navigate to picker) */
  onGroupByClick?: () => void;
  /** Callback when "Show as" row is clicked (to navigate to show-as picker) */
  onShowAsClick?: () => void;
  /** Available properties (for resolving labels) */
  properties?: readonly PropertyMeta[];
}

// Property types that support "Show As" options
type ShowAsGroupType = "status" | "date" | "text" | "number";

const SHOW_AS_OPTIONS: Record<
  ShowAsGroupType,
  { value: string; label: string }[]
> = {
  status: [
    { value: "option", label: "Option" },
    { value: "group", label: "Group" },
  ],
  date: [
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "year", label: "Year" },
    { value: "relative", label: "Relative" },
  ],
  text: [
    { value: "exact", label: "Exact" },
    { value: "alphabetical", label: "Alphabetical" },
  ],
  number: [
    { value: "1", label: "1s" },
    { value: "10", label: "10s" },
    { value: "100", label: "100s" },
    { value: "1000", label: "1000s" },
  ],
};

const SORT_ORDER_LABELS: Record<string, string> = {
  asc: "Ascending",
  desc: "Descending",
};

/**
 * Group editor showing all group settings.
 *
 * Displays:
 * - Group by (navigates to property picker)
 * - Show As (only for status/date/text, navigates to show-as picker)
 * - Sort (Popover with Command list)
 * - Hide empty groups (toggle switch)
 */
function GroupEditor({
  properties = [],
  onGroupByClick,
  onShowAsClick,
}: GroupEditorProps) {
  const [sortOpen, setSortOpen] = useState(false);

  const {
    group,
    groupProperty,
    groupType,
    groupSortOrder,
    hideEmptyGroups,
    setHideEmptyGroups,
  } = useGroupParams();

  // Get the selected property meta
  const selectedProperty = groupProperty
    ? properties.find((p) => p.id === groupProperty)
    : null;

  // Get display label for current group
  const groupLabel = selectedProperty?.label ?? groupProperty ?? "None";

  // Get show-as options based on group type
  const showAsOptions =
    groupType && groupType in SHOW_AS_OPTIONS
      ? SHOW_AS_OPTIONS[groupType as ShowAsGroupType]
      : null;

  // Get current show-as value
  const getCurrentShowAs = () => {
    if (!group) {
      return null;
    }
    if ("byStatus" in group) {
      return group.byStatus.showAs;
    }
    if ("byDate" in group) {
      return group.byDate.showAs;
    }
    if ("byText" in group) {
      return group.byText.showAs ?? "exact";
    }
    if ("byNumber" in group) {
      // Number uses step value as the showAs identifier
      return String(group.byNumber.showAs?.step ?? 100);
    }
    return null;
  };

  const currentShowAs = getCurrentShowAs();
  const currentShowAsLabel =
    showAsOptions?.find((o) => o.value === currentShowAs)?.label ??
    currentShowAs;

  // Get current sort order label
  const currentSortLabel = SORT_ORDER_LABELS[groupSortOrder] ?? groupSortOrder;

  return (
    <Command className="p-0">
      <CommandList>
        <CommandGroup>
          {/* Group by property */}
          <CommandItem onSelect={onGroupByClick} value="group-by">
            <span className="flex-1">Group by</span>
            <span className="text-muted-foreground text-sm">{groupLabel}</span>
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          </CommandItem>

          {/* Show As (only for types that support it) */}
          {showAsOptions && (
            <CommandItem onSelect={onShowAsClick} value="show-as">
              <span className="flex-1">Show as</span>
              <span className="text-muted-foreground text-sm">
                {currentShowAsLabel}
              </span>
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            </CommandItem>
          )}

          {/* Sort groups - Popover with Command */}
          <Popover onOpenChange={setSortOpen} open={sortOpen}>
            <PopoverTrigger
              nativeButton={false}
              render={
                <CommandItem
                  onSelect={() => setSortOpen((prev) => !prev)}
                  value="sort"
                />
              }
            >
              <span className="flex-1">Sort</span>
              <span className="text-muted-foreground text-sm">
                {currentSortLabel}
              </span>
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 p-0">
              <GroupDirectionPicker onSetDirection={() => setSortOpen(false)} />
            </PopoverContent>
          </Popover>

          {/* Hide empty groups toggle */}
          <CommandItem
            onSelect={() => setHideEmptyGroups(!hideEmptyGroups)}
            value="hide-empty"
          >
            <span className="flex-1">Hide empty groups</span>
            <div
              className={`h-5 w-9 rounded-full transition-colors ${
                hideEmptyGroups ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`mt-0.5 h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${
                  hideEmptyGroups ? "ml-0.5 translate-x-4" : "translate-x-0.5"
                }`}
              />
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export { GroupEditor, type GroupEditorProps };
