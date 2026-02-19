"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  action?: {
    label: string;
    onClick: () => void;
  };
  description?: string;
  icon?: LucideIcon;
  title: string;
}

/**
 * Empty state component
 * Shows when there's no data to display
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-muted p-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="font-semibold text-lg">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-muted-foreground text-sm">
          {description}
        </p>
      )}
      {action && (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
