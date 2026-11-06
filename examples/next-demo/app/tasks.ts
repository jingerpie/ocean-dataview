import type { DataViewProperty } from "@jingerpie/dataview-core";

export interface Task {
  done: boolean;
  dueDate: string;
  estimate: number;
  id: string;
  priority: string;
  progress: number;
  status: string;
  tags: string[];
  title: string;
}

const VERBS = ["Design", "Build", "Review", "Test", "Ship", "Document"];
const NOUNS = [
  "login flow",
  "billing page",
  "search API",
  "onboarding email",
  "audit log",
  "export to CSV",
  "dark mode",
  "mobile nav",
  "rate limiter",
  "settings page",
];
const STATUSES = ["Backlog", "Todo", "In progress", "In review", "Done"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const TAGS = ["Frontend", "Backend", "Design", "Infra", "Bug"];

/** Deterministic sample data so server and client renders match. */
export const tasks: Task[] = Array.from({ length: 60 }, (_, i) => {
  const status = STATUSES[(i * 7) % STATUSES.length] ?? "Backlog";
  const day = String(1 + ((i * 5) % 28)).padStart(2, "0");
  const month = String(1 + (i % 6)).padStart(2, "0");
  return {
    id: `task-${i + 1}`,
    title: `${VERBS[i % VERBS.length]} ${NOUNS[(i * 3) % NOUNS.length]}`,
    status,
    priority: PRIORITIES[(i * 3) % PRIORITIES.length] ?? "Low",
    tags: TAGS.filter((_, t) => (i + t) % 3 === 0).slice(0, 2),
    estimate: 1 + ((i * 13) % 21),
    progress: status === "Done" ? 100 : (i * 17) % 95,
    dueDate: `2026-${month}-${day}`,
    done: status === "Done",
  };
});

export const taskProperties = [
  { id: "title", name: "Title", type: "text" },
  {
    id: "status",
    name: "Status",
    type: "status",
    config: {
      groups: [
        { name: "To-do", color: "gray-subtle", options: ["Backlog", "Todo"] },
        {
          name: "In progress",
          color: "blue-subtle",
          options: ["In progress", "In review"],
        },
        { name: "Complete", color: "green-subtle", options: ["Done"] },
      ],
    },
  },
  {
    id: "priority",
    name: "Priority",
    type: "select",
    config: {
      options: [
        { value: "Low", color: "gray-subtle" },
        { value: "Medium", color: "blue-subtle" },
        { value: "High", color: "yellow-subtle" },
        { value: "Urgent", color: "red-subtle" },
      ],
    },
  },
  {
    id: "tags",
    name: "Tags",
    type: "multiSelect",
    config: {
      options: [
        { value: "Frontend", color: "purple-subtle" },
        { value: "Backend", color: "teal-subtle" },
        { value: "Design", color: "pink-subtle" },
        { value: "Infra", color: "gray-subtle" },
        { value: "Bug", color: "red-subtle" },
      ],
    },
  },
  { id: "estimate", name: "Estimate (h)", type: "number" },
  {
    id: "progress",
    name: "Progress",
    type: "number",
    config: { showAs: { type: "bar", color: "green", divideBy: 100 } },
  },
  { id: "dueDate", name: "Due", type: "date" },
  { id: "done", name: "Done", type: "checkbox" },
] satisfies readonly DataViewProperty<Task>[];
