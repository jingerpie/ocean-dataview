"use client";

import { type DropdownAction, SplitButton } from "../split-button";

interface DataRowActionsProps {
  /**
   * Additional custom actions
   */
  additionalActions?: DropdownAction[];

  /**
   * Archive action callback
   */
  onArchive?: () => void;

  /**
   * Delete action callback
   */
  onDelete?: () => void;

  /**
   * Edit action callback
   */
  onEdit?: () => void;

  /**
   * Primary action callback
   */
  onPrimaryAction?: () => void;

  /**
   * View action callback
   */
  onView?: () => void;

  /**
   * Label for primary action button
   */
  primaryLabel?: string;
}

/**
 * DataRowActions - Row action buttons component
 * Provides common row actions (Edit, View, Archive, Delete)
 * with customizable primary action and additional actions
 */
export function DataRowActions({
  additionalActions = [],
  primaryLabel,
  onPrimaryAction,
  onEdit,
  onView,
  onArchive,
  onDelete,
}: DataRowActionsProps) {
  const defaultActions: DropdownAction[] = [
    ...(onEdit
      ? [
          {
            label: "Edit",
            onClick: onEdit,
          },
        ]
      : []),
    ...(onView
      ? [
          {
            label: "View",
            onClick: onView,
          },
        ]
      : []),
    ...(onArchive
      ? [
          {
            label: "Archive",
            onClick: onArchive,
            className: "text-destructive focus:text-destructive",
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            label: "Delete",
            onClick: onDelete,
            className: "text-destructive focus:text-destructive",
          },
        ]
      : []),
  ];

  const dropdownActions = [...additionalActions, ...defaultActions];

  return (
    <div className="flex items-center justify-end">
      <SplitButton
        dropdownActions={dropdownActions}
        onPrimaryAction={onPrimaryAction ?? (() => undefined)}
        primaryLabel={primaryLabel}
      />
    </div>
  );
}
