import type { TabOption } from "./dataview-tab";

/**
 * Tab options for switching between flat and grouped product views.
 */
export const productTabOptions: TabOption[] = [
  { label: "Flat", group: null },
  {
    label: "Group",
    group: { byStatus: { property: "availability", showAs: "option" } },
  },
];
