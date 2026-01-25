/**
 * Status group constants for status property components
 * Shared between compute-data.ts and status-property.tsx
 */

export type StatusGroup = "todo" | "inProgress" | "complete" | "canceled";

/**
 * Maps status group to display label
 */
export const STATUS_GROUP_LABELS: Record<StatusGroup, string> = {
  todo: "To Do",
  inProgress: "In Progress",
  complete: "Complete",
  canceled: "Canceled",
};

/**
 * Maps status group label back to group key
 */
export const STATUS_LABEL_TO_GROUP: Record<string, StatusGroup> = {
  "To Do": "todo",
  "In Progress": "inProgress",
  Complete: "complete",
  Canceled: "canceled",
};

/**
 * Order for sorting status groups
 */
export const STATUS_GROUP_ORDER: Record<StatusGroup, number> = {
  todo: 0,
  inProgress: 1,
  complete: 2,
  canceled: 3,
};
