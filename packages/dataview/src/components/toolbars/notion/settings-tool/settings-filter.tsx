"use client";

import { useFilterParams } from "../../../../hooks";
import type { PropertyMeta } from "../../../../types";
import { FilterBulkEditor } from "../../../ui/toolbar/filter/filter-bulk-editor";
import { SimpleFilterPicker } from "../../../ui/toolbar/filter/simple-filter-picker";

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
