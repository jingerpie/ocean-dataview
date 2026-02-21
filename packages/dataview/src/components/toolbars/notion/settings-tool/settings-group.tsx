"use client";

interface SettingsGroupProps {
  /** Current group property name */
  groupProperty?: string;
}

/**
 * Group section for settings panel.
 *
 * TODO: Implement group by property picker
 */
function SettingsGroup({ groupProperty }: SettingsGroupProps) {
  return (
    <div className="p-3 text-muted-foreground text-sm">
      {groupProperty ? (
        <span>Grouped by: {groupProperty}</span>
      ) : (
        <span>Group settings coming soon...</span>
      )}
    </div>
  );
}

export { SettingsGroup, type SettingsGroupProps };
