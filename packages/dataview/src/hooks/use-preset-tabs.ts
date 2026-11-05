"use client";

import { useEffect, useMemo, useRef } from "react";
import { encodeFilter } from "../parsers/filter";
import type { SortQuery, WhereNode } from "../types/filter.type";
import type { GroupConfigInput } from "../types/group.type";
import {
  collectFilterProperties,
  extractPropertiesFromFilter,
  removePropertiesFromFilter,
} from "../utils/where-filter";
import { useFilterParams } from "./use-filter-params";
import { useGroupParams } from "./use-group-params";
import { useSortParams } from "./use-sort-params";

export interface TabOption {
  /**
   * Filter to apply when selected. Only nodes on properties owned by this
   * tab group (referenced by any option's filter) are replaced — other
   * filter rules are preserved. undefined = don't touch the filter (such
   * an option also never derives as active); null = clear the owned
   * properties. Referenced properties must exist in the view's property
   * schema and be filterable, or validation strips the rules right after
   * selection and the tab derives inactive.
   */
  filter?: WhereNode[] | null;
  /** Group config to apply when selected. null = flat (no grouping) */
  group?: GroupConfigInput | null;
  /** Display label for the tab. Also used as the tab value — must be unique. */
  label: string;
  /** Sort to apply when selected. undefined = no change, null = clear */
  sort?: SortQuery[] | null;
}

export interface UsePresetTabsOptions {
  /** Fires whenever the derived active option changes */
  onActiveChange?: (label: string | null) => void;
  options: TabOption[];
}

/**
 * Preset tab state over the dataview filter, group, and sort.
 *
 * Each call owns the properties referenced by its options' filters.
 * Selecting an option replaces only the rules on those properties. The
 * active option is derived from the filter state, so it survives reload
 * and stays in sync with filter chips; it is `null` when nothing matches.
 */
export function usePresetTabs({
  onActiveChange,
  options,
}: UsePresetTabsOptions) {
  const { setGroup, clearGroup } = useGroupParams();
  const { filter, setFilter, clearFilter } = useFilterParams();
  const { setSort, clearSort } = useSortParams();

  // Properties referenced by any option's filter. Selecting a tab swaps
  // the rules on these properties and leaves the rest of the filter alone.
  const ownedProperties = useMemo(() => {
    const owned = new Set<string>();
    for (const option of options) {
      collectFilterProperties(option.filter ?? [], owned);
    }
    return owned;
  }, [options]);

  // Derive the active option: this instance's slice of the filter must
  // exactly match an option's nodes (canonical DSL string compare).
  const activeLabel = useMemo(() => {
    const extracted = extractPropertiesFromFilter(
      filter ?? [],
      ownedProperties
    );
    const encoded = encodeFilter(extracted);
    const active = options.find(
      (option) =>
        option.filter !== undefined &&
        encodeFilter(option.filter ?? []) === encoded
    );
    return active?.label ?? null;
  }, [filter, options, ownedProperties]);

  const previousLabel = useRef(activeLabel);
  useEffect(() => {
    if (previousLabel.current === activeLabel) {
      return;
    }
    previousLabel.current = activeLabel;
    onActiveChange?.(activeLabel);
  }, [activeLabel, onActiveChange]);

  const selectOption = (label: string | null) => {
    if (!label) {
      return;
    }
    const option = options.find((opt) => opt.label === label);
    if (!option) {
      return;
    }

    if (option.group === null) {
      clearGroup();
    } else if (option.group !== undefined) {
      setGroup(option.group);
    }

    if (option.filter !== undefined) {
      const preserved = removePropertiesFromFilter(
        filter ?? [],
        ownedProperties
      );
      const next = option.filter ? [...preserved, ...option.filter] : preserved;
      if (next.length > 0) {
        setFilter(next);
      } else {
        clearFilter();
      }
    }

    if (option.sort === null) {
      clearSort();
    } else if (option.sort !== undefined) {
      setSort(option.sort);
    }
  };

  return { activeLabel, selectOption };
}
