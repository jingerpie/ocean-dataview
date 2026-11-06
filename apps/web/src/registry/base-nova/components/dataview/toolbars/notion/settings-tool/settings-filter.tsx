"use client";

import type { PropertyMeta } from "@jingerpie/dataview-core";
import { useFilterParams } from "@jingerpie/dataview-react";
import { FilterBulkEditor } from "@/registry/base-nova/components/dataview/filter/filter-bulk-editor";
import { SimpleFilterPicker } from "@/registry/base-nova/components/dataview/filter/simple-filter-picker";

interface SettingsFilterProps {
  /** Callback after all filters deleted */
  onDeleteAll?: () => void;
  /** Callback after filter is added */
  onFilterAdded?: () => void;
  /** Available properties to filter by */
  properties: readonly PropertyMeta[];
}

/**
 * Filter section for settings panel.
 *
 * - No filters: Shows SimpleFilterPicker
 * - Has filters: Shows FilterBulkEditor
 */
function SettingsFilter({
  properties,
  onFilterAdded,
  onDeleteAll,
}: SettingsFilterProps) {
  const { filter } = useFilterParams();

  const hasFilters = filter && filter.length > 0;

  if (!hasFilters) {
    return (
      <SimpleFilterPicker onAddFilter={onFilterAdded} properties={properties} />
    );
  }

  return <FilterBulkEditor onDeleteAll={onDeleteAll} properties={properties} />;
}

export { SettingsFilter, type SettingsFilterProps };
