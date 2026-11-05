"use client";

import type { PropertyMeta } from "@sparkyidea/dataview-core";
import { useSortParams } from "@sparkyidea/dataview-react";
import { SortBulkEditor } from "@/registry/base-nova/components/dataview/sort/sort-bulk-editor";
import { SortPicker } from "@/registry/base-nova/components/dataview/sort/sort-picker";

interface SettingsSortProps {
  /** Callback after all sorts deleted */
  onDeleteAll?: () => void;
  /** Callback after sort is added */
  onSortAdded?: () => void;
  /** Available properties to sort by */
  properties: readonly PropertyMeta[];
}

/**
 * Sort section for settings panel.
 *
 * - No sorts: Shows SortPicker
 * - Has sorts: Shows SortBulkEditor
 */
function SettingsSort({
  properties,
  onSortAdded,
  onDeleteAll,
}: SettingsSortProps) {
  const { sort: sorts } = useSortParams();

  if (sorts.length === 0) {
    return <SortPicker onAddSort={onSortAdded} properties={properties} />;
  }

  return <SortBulkEditor onDeleteAll={onDeleteAll} properties={properties} />;
}

export { SettingsSort, type SettingsSortProps };
