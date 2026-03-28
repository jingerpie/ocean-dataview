"use client";

import { useGroupParams } from "../../../../hooks/use-group-params";
import type { PropertyMeta } from "../../../../types/property.type";
import { GroupEditor } from "../../../ui/group/group-editor";
import { GroupPicker } from "../../../ui/group/group-picker";
import { GroupShowAsPicker } from "../../../ui/group/group-show-as-picker";

type SubSection = "property" | "showAs" | null;

interface SettingsGroupProps {
  /** Callback when navigating to property picker (to update parent header) */
  onSubSectionChange?: (section: SubSection) => void;
  /** Available properties for grouping */
  properties?: readonly PropertyMeta[];
  /** Current sub-section (controlled by parent) */
  subSection?: SubSection;
}

/**
 * Group section for settings panel.
 *
 * Uses composable components:
 * - GroupEditor: main settings (group by, show as, sort, hide empty, visibility)
 * - GroupPicker: property picker for selecting group property
 * - GroupShowAsPicker: show-as option picker
 *
 * If no group is set, shows GroupPicker directly.
 * If group is set, shows GroupEditor with all settings.
 */
function SettingsGroup({
  properties = [],
  onSubSectionChange,
  subSection = null,
}: SettingsGroupProps) {
  const { isGrouped } = useGroupParams();

  // Render property picker sub-section
  if (subSection === "property") {
    return (
      <GroupPicker
        onSetGroup={() => onSubSectionChange?.(null)}
        properties={properties}
      />
    );
  }

  // Render show-as picker sub-section
  if (subSection === "showAs") {
    return <GroupShowAsPicker onSetShowAs={() => onSubSectionChange?.(null)} />;
  }

  // If no group is set, show picker directly
  if (!isGrouped) {
    return <GroupPicker properties={properties} />;
  }

  // Main settings view (when group is set)
  return (
    <GroupEditor
      onGroupByClick={() => onSubSectionChange?.("property")}
      onShowAsClick={() => onSubSectionChange?.("showAs")}
      properties={properties}
    />
  );
}

export { SettingsGroup, type SettingsGroupProps };
