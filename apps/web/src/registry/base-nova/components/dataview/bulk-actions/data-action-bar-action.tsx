"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@sparkyidea/ui/components/tooltip";
import { Loader } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/registry/base-nova/ui/dataview-button";

type DataActionBarActionProps = ComponentProps<typeof Button> & {
  /**
   * Tooltip text to display on hover
   */
  tooltip?: string;

  /**
   * Whether the action is pending/loading
   * Shows a spinner when true
   */
  isPending?: boolean;
};

/**
 * DataActionBarAction - Action button for bulk operations
 * Displays loading spinner when pending
 * Optional tooltip support
 */
export function DataActionBarAction({
  size = "sm",
  tooltip,
  isPending,
  disabled,
  className,
  children,
  ...props
}: DataActionBarActionProps) {
  const trigger = (
    <Button
      className={cn(className)}
      disabled={disabled || isPending}
      size={size}
      variant="outline"
      {...props}
    >
      {isPending ? <Loader className="animate-spin" /> : children}
    </Button>
  );

  if (!tooltip) {
    return trigger;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={trigger} />
      <TooltipContent sideOffset={6}>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
