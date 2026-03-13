"use client";

import {
  useFilterParams,
  useGroupParams,
  useSortParams,
} from "@sparkyidea/dataview/hooks";
import type {
  GroupConfigInput,
  SortQuery,
  WhereNode,
} from "@sparkyidea/shared/types";
import { Label } from "@sparkyidea/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sparkyidea/ui/components/select";
import { Tabs, TabsList, TabsTrigger } from "@sparkyidea/ui/components/tabs";
import { useState } from "react";

export interface TabOption {
  /** Filter to apply when selected. undefined = no change, null = clear */
  filter?: WhereNode[] | null;
  /** Group config to apply when selected. null = flat (no grouping) */
  group?: GroupConfigInput | null;
  /** Display label for the tab */
  label: string;
  /** Sort to apply when selected. undefined = no change, null = clear */
  sort?: SortQuery[] | null;
}

interface DataViewTabProps {
  /** Additional class name */
  className?: string;
  /** Tab options - first option is the default */
  options: TabOption[];
}

/**
 * Tab component for switching between views with different filter, sort, and group settings.
 *
 * Uses URL state via nuqs to persist the view mode.
 * Shows tabs on desktop, select dropdown on mobile.
 *
 * @example
 * ```tsx
 * // Group tabs
 * <DataViewTab
 *   options={[
 *     { label: "All", group: null },
 *     { label: "By Category", group: { propertyType: "select", propertyId: "category" } },
 *   ]}
 * />
 *
 * // Filter tabs
 * <DataViewTab
 *   options={[
 *     { label: "All", filter: null },
 *     { label: "In Stock", filter: [{ property: "availability", condition: "eq", value: "In stock" }] },
 *   ]}
 * />
 *
 * // Combined filter + sort tabs
 * <DataViewTab
 *   options={[
 *     { label: "All", filter: null, sort: null },
 *     { label: "Premium", filter: [{ property: "price", condition: "gte", value: 100 }], sort: [{ property: "price", direction: "desc" }] },
 *   ]}
 * />
 * ```
 */
export function DataViewTab({ options, className }: DataViewTabProps) {
  const { setGroup, clearGroup } = useGroupParams();
  const { setFilter, clearFilter } = useFilterParams();
  const { setSort, clearSort } = useSortParams();

  // Track selected tab by label (defaults to first option)
  const [selectedValue, setSelectedValue] = useState(
    () => options[0]?.label ?? ""
  );

  const handleValueChange = (label: string | null) => {
    if (!label) {
      return;
    }
    const option = options.find((opt) => opt.label === label);
    if (!option) {
      return;
    }

    // Update selected tab
    setSelectedValue(label);

    // Set exact state - clear if undefined or null, otherwise set value
    // Group
    if (option.group) {
      setGroup(option.group);
    } else {
      clearGroup();
    }

    // Filter
    if (option.filter) {
      setFilter(option.filter);
    } else {
      clearFilter();
    }

    // Sort
    if (option.sort) {
      setSort(option.sort);
    } else {
      clearSort();
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
