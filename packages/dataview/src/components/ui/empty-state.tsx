"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

export type EmptyStateVariant = "noData" | "noResults";

/** Default configurations for each variant */
export const EMPTY_STATE_DEFAULTS: Record<
  EmptyStateVariant,
  { icon: LucideIcon; title: string; description: string }
> = {
  noData: {
    icon: Inbox,
    title: "No items available",
    description: "There are no items to display",
  },
  noResults: {
    icon: Search,
    title: "No results found",
    description: "No data matches the current filters",
  },
};

interface EmptyStateProps {
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  description?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  title?: string;
  /** Variant determines default icon, title, and description */
  variant?: EmptyStateVariant;
}

/**
 * Empty state component
 * Shows when there's no data to display
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  variant,
  className,
}: EmptyStateProps) {
  // Resolve defaults based on variant
  const defaults = variant ? EMPTY_STATE_DEFAULTS[variant] : undefined;
  const Icon = icon ?? defaults?.icon;
  const resolvedTitle = title ?? defaults?.title ?? "No data";
  const resolvedDescription = description ?? defaults?.description;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-12 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-muted p-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="font-semibold text-lg">{resolvedTitle}</h3>
      {resolvedDescription && (
        <p className="mt-2 max-w-sm text-muted-foreground text-sm">
          {resolvedDescription}
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
