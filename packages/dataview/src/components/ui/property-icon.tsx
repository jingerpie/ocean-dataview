"use client";

import { getPropertyIcon } from "../../lib/property-icons";
import { cn } from "../../lib/utils";
import type { PropertyType } from "../../types";

interface PropertyIconProps {
  /** The property type to display icon for */
  type: PropertyType;
  /** Additional class names */
  className?: string;
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
