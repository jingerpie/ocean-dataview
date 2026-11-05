"use client";

import { CheckCircle, CircleDashed, Clock, XCircle } from "lucide-react";
import { StatusProperty } from "@/registry/base-nova/components/dataview/properties/status-property";

const config = {
  groups: [
    {
      name: "Not Started",
      color: "gray-subtle" as const,
      icon: CircleDashed,
      options: ["backlog", "todo"],
    },
    {
      name: "In Progress",
      color: "blue-subtle" as const,
      icon: Clock,
      options: ["in_progress", "in_review"],
    },
    {
      name: "Complete",
      color: "green-subtle" as const,
      icon: CheckCircle,
      options: ["done"],
    },
    {
      name: "Cancelled",
      color: "red-subtle" as const,
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
