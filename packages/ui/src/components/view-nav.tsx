"use client";

import { cn } from "@sparkyidea/ui/lib/utils";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface ViewNavItem {
  label: string;
  /** Full URL to the view (e.g., "/pagination/table?filter=...") */
  value: string;
}

interface ViewNavProps {
  views: ViewNavItem[];
}

export function ViewNav({ views }: ViewNavProps) {
  const pathname = usePathname();

  return (
    <nav className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
      {views.map((view) => {
        const viewPath = view.value.split("?")[0];
        const isActive = pathname === viewPath;

        return (
          <Link
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 font-medium text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "bg-background text-foreground shadow"
                : "hover:bg-background/50 hover:text-foreground"
            )}
            href={view.value as Route}
            key={view.value}
          >
            {view.label}
          </Link>
        );
      })}
    </nav>
  );
}
