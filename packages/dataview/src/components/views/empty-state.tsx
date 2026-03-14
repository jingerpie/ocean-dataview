"use client";

import { SearchX } from "lucide-react";
import { cn } from "../../lib/utils";

interface EmptyStateProps {
  className?: string;
}

/**
 * Empty state component
 * Shows when there's no data to display
 */
export function EmptyState({ className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[300px] flex-col items-center justify-center px-4 py-12 text-center",
        className
      )}
    >
      <div className="mb-4 rounded-full bg-muted p-3">
        <SearchX className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg">No Data Found</h3>
      <p className="mt-2 max-w-sm text-muted-foreground text-sm">
        There is no data to show you right now
      </p>
    </div>
  );
}
