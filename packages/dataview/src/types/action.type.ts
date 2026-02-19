import type { ReactNode } from "react";

/**
 * Action definition for data view rows
 * Used for both individual row actions and bulk operations
 */
export interface Action<T> {
  /**
   * Only show this action in bulk action bar
   * Hides from individual row actions
   */
  bulkOnly?: boolean;

  /**
   * Optional icon to display with the action
   */
  icon?: ReactNode;

  /**
   * Loading state for async actions
   * Shows spinner when true
   */
  isPending?: boolean;
  /**
   * Action label displayed to users
   */
  label: string;

  /**
   * Action handler - always receives an array of items
   * For row actions: array with single item
   * For bulk actions: array with all selected items
   */
  onClick: (items: T[]) => void;

  /**
   * Mark as primary action
   * Shows as main button in row actions SplitButton
   * First action with primary: true is used
   */
  primary?: boolean;

  /**
   * Only show this action in row actions
   * Hides from bulk action bar
   */
  rowOnly?: boolean;

  /**
   * Visual variant for the action
   * 'destructive' renders in red for dangerous actions
   */
  variant?: "default" | "destructive";
}
