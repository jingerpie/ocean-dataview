"use client";

import { useSubGroupParams } from "../../../../hooks";
import type { PropertyMeta } from "../../../../types";
import { GroupEditor } from "../../../ui/toolbar/group/group-editor";
import { GroupPicker } from "../../../ui/toolbar/group/group-picker";
import { GroupShowAsPicker } from "../../../ui/toolbar/group/group-show-as-picker";

type SubSection = "property" | "showAs" | null;

interface SettingsSubGroupProps {
  /** Callback when navigating to property picker (to update parent header) */
  onSubSectionChange?: (section: SubSection) => void;
  /** Available properties for grouping */
  properties?: readonly PropertyMeta[];
  /** Current sub-section (controlled by parent) */
  subSection?: SubSection;
}

/**
 * Sub-group section for settings panel (board view only).
 *
 * Uses the same composable components as SettingsGroup but with mode="subGroup":
 * - GroupEditor: main settings (sub-group by, show as, sort, hide empty)
 * - GroupPicker: property picker for selecting sub-group property
 * - GroupShowAsPicker: show-as option picker
 *
 * If no sub-group is set, shows GroupPicker directly.
 * If sub-group is set, shows GroupEditor with all settings.
 */
function SettingsSubGroup({
  onSubSectionChange,
  properties = [],
  subSection = null,
}: SettingsSubGroupProps) {
  const { isSubGrouped } = useSubGroupParams();

  // Render property picker sub-section
  if (subSection === "property") {
    return (
      <GroupPicker
        mode="subGroup"
        onSetGroup={() => onSubSectionChange?.(null)}
        properties={properties}
      />
    );
  }

  // Render show-as picker sub-section
  if (subSection === "showAs") {
    return (
      <GroupShowAsPicker
        mode="subGroup"
        onSetShowAs={() => onSubSectionChange?.(null)}
      />
    );
  }

  // If no sub-group is set, show picker directly
  if (!isSubGrouped) {
    return <GroupPicker mode="subGroup" properties={properties} />;
  }

  // Main settings view (when sub-group is set)
  return (
    <GroupEditor
      label="Sub-group by"
      mode="subGroup"
      onGroupByClick={() => onSubSectionChange?.("property")}
      onShowAsClick={() => onSubSectionChange?.("showAs")}
      properties={properties}
    />
  );
}

export { SettingsSubGroup, type SettingsSubGroupProps };
