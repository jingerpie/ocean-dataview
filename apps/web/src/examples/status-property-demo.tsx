"use client";

import { StatusProperty } from "@sparkyidea/dataview/properties";
import { CheckCircle, CircleDashed, Clock, XCircle } from "lucide-react";

const config = {
  groups: [
    {
      name: "Not Started",
      color: "gray" as const,
      icon: CircleDashed,
      options: ["backlog", "todo"],
    },
    {
      name: "In Progress",
      color: "blue" as const,
      icon: Clock,
      options: ["in_progress", "in_review"],
    },
    {
      name: "Complete",
      color: "green" as const,
      icon: CheckCircle,
      options: ["done"],
    },
    {
      name: "Cancelled",
      color: "red" as const,
      icon: XCircle,
      options: ["cancelled"],
    },
  ],
};

export function StatusPropertyDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusProperty config={config} value="todo" />
      <StatusProperty config={config} value="in_progress" />
      <StatusProperty config={config} value="done" />
      <StatusProperty config={config} value="cancelled" />
    </div>
  );
}
