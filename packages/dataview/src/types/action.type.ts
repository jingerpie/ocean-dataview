import type { ReactNode } from "react";

/**
 * Bulk action definition for TableView
 * Used for operations on multiple selected rows
 */
export interface BulkAction<T> {
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
   * Action handler - receives array of selected items
   */
  onClick: (items: T[]) => void;

  /**
   * Visual variant for the action
   * 'destructive' renders in red for dangerous actions
   */
  variant?: "default" | "destructive";
}
