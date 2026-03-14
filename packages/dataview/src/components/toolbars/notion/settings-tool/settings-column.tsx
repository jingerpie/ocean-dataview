"use client";

import { useColumnParams } from "../../../../hooks";
import type { PropertyMeta } from "../../../../types";
import { GroupEditor } from "../../../ui/group/group-editor";
import { GroupPicker } from "../../../ui/group/group-picker";
import { GroupShowAsPicker } from "../../../ui/group/group-show-as-picker";

type SubSection = "property" | "showAs" | null;

interface SettingsColumnProps {
  /** Callback when navigating to property picker (to update parent header) */
  onSubSectionChange?: (section: SubSection) => void;
  /** Available properties for grouping */
  properties?: readonly PropertyMeta[];
  /** Current sub-section (controlled by parent) */
  subSection?: SubSection;
}

/**
 * Column section for settings panel (board view only).
 *
 * Uses the same composable components as SettingsGroup but with mode="column":
 * - GroupEditor: main settings (column by, show as, sort, hide empty)
 * - GroupPicker: property picker for selecting column property
 * - GroupShowAsPicker: show-as option picker
 *
 * If no column is set, shows GroupPicker directly.
 * If column is set, shows GroupEditor with all settings.
 */
function SettingsColumn({
  onSubSectionChange,
  properties = [],
  subSection = null,
}: SettingsColumnProps) {
  const { hasColumn } = useColumnParams();

  // Render property picker sub-section
  if (subSection === "property") {
    return (
      <GroupPicker
        mode="column"
        onSetGroup={() => onSubSectionChange?.(null)}
        properties={properties}
      />
    );
  }

  // Render show-as picker sub-section
  if (subSection === "showAs") {
    return (
      <GroupShowAsPicker
        mode="column"
        onSetShowAs={() => onSubSectionChange?.(null)}
      />
    );
  }

  // If no column is set, show picker directly
  if (!hasColumn) {
    return <GroupPicker mode="column" properties={properties} />;
  }

  // Main settings view (when column is set)
  return (
    <GroupEditor
      label="Column by"
      mode="column"
      onGroupByClick={() => onSubSectionChange?.("property")}
      onShowAsClick={() => onSubSectionChange?.("showAs")}
      properties={properties}
    />
  );
}

export { SettingsColumn, type SettingsColumnProps };
