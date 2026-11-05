"use client";

import type { PropertyType } from "@jingerpie/dataview-core";
import { cn } from "@/lib/utils";
import { getPropertyIcon } from "@/registry/base-nova/lib/dataview/property-icons";

interface PropertyIconProps {
  /** Additional class names */
  className?: string;
  /** The property type to display icon for */
  type: PropertyType;
}

/**
 * Displays an icon based on the property type.
 *
 * Maps property types to their corresponding Lucide icons.
 */
function PropertyIcon({ type, className }: PropertyIconProps) {
  const Icon = getPropertyIcon(type);
  return <Icon className={cn("size-4", className)} />;
}

export { PropertyIcon, type PropertyIconProps };
