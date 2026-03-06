"use client";

import { useGroupParams } from "@sparkyidea/dataview/hooks";
import type { GroupConfigInput } from "@sparkyidea/shared/utils/parsers/group";
import { Label } from "@sparkyidea/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sparkyidea/ui/components/select";
import { Tabs, TabsList, TabsTrigger } from "@sparkyidea/ui/components/tabs";

export interface TabOption {
  /** Group config to apply when selected. null = flat (no grouping) */
  group: GroupConfigInput | null;
  /** Display label for the tab */
  label: string;
}

interface DataViewTabProps {
  /** Additional class name */
  className?: string;
  /** Tab options - first option is the default */
  options: TabOption[];
}

/**
 * Tab component for switching between flat and grouped views.
 *
 * Uses URL state via nuqs to persist the view mode.
 * Shows tabs on desktop, select dropdown on mobile.
 *
 * @example
 * ```tsx
 * <DataViewTab
 *   options={[
 *     { label: "All", group: null },
 *     { label: "By Category", group: { bySelect: { property: "category" } } },
 *     { label: "By Status", group: { byStatus: { property: "availability" } } },
 *   ]}
 * />
 * ```
 */
export function DataViewTab({ options, className }: DataViewTabProps) {
  const { group, setGroup, clearGroup } = useGroupParams();

  // Find current selected option based on group state
  const selectedOption = options.find((opt) => {
    if (opt.group === null && group === null) {
      return true;
    }
    if (opt.group === null || group === null) {
      return false;
    }
    // Compare group configs by checking the property
    return getGroupProperty(opt.group) === getGroupProperty(group);
  });

  const defaultOption = options[0];
  const selectedValue = selectedOption?.label ?? defaultOption?.label ?? "";

  const handleValueChange = (label: string | null) => {
    if (!label) {
      return;
    }
    const option = options.find((opt) => opt.label === label);
    if (!option) {
      return;
    }

    if (option.group === null) {
      clearGroup();
    } else {
      setGroup(option.group);
    }
  };

  return (
    <Tabs
      className={className}
      onValueChange={handleValueChange}
      value={selectedValue}
    >
      {/* Mobile: Select dropdown */}
      <Label className="sr-only" htmlFor="view-selector">
        View
      </Label>
      <Select onValueChange={handleValueChange} value={selectedValue}>
        <SelectTrigger className="flex w-fit sm:hidden" id="view-selector">
          <SelectValue placeholder="Select a view" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.label} value={option.label}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Desktop: Tabs */}
      <TabsList className="hidden sm:flex">
        {options.map((option) => (
          <TabsTrigger key={option.label} value={option.label}>
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

/**
 * Extract property from group config.
 */
function getGroupProperty(group: GroupConfigInput | null): string | null {
  if (!group) {
    return null;
  }
  if ("bySelect" in group) {
    return group.bySelect.property;
  }
  if ("byStatus" in group) {
    return group.byStatus.property;
  }
  if ("byDate" in group) {
    return group.byDate.property;
  }
  if ("byCheckbox" in group) {
    return group.byCheckbox.property;
  }
  if ("byMultiSelect" in group) {
    return group.byMultiSelect.property;
  }
  if ("byText" in group) {
    return group.byText.property;
  }
  if ("byNumber" in group) {
    return group.byNumber.property;
  }
  return null;
}
