"use client";

import { Button } from "@ocean-dataview/ui/components/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@ocean-dataview/ui/components/tooltip";
import { cn } from "@ocean-dataview/ui/lib/utils";
import { Loader } from "lucide-react";
import type * as React from "react";

interface DataActionBarActionProps extends React.ComponentProps<typeof Button> {
	/**
	 * Tooltip text to display on hover
	 */
	tooltip?: string;

	/**
	 * Whether the action is pending/loading
	 * Shows a spinner when true
	 */
	isPending?: boolean;
}

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
			variant="secondary"
			size={size}
			className={cn(
				"gap-2 border border-secondary bg-secondary/50 hover:bg-secondary/70 [&>svg]:size-4",
				size === "icon" ? "size-9" : "h-9",
				className,
			)}
			disabled={disabled || isPending}
			{...props}
		>
			{isPending ? <Loader className="animate-spin" /> : children}
		</Button>
	);

	if (!tooltip) return trigger;

	return (
		<Tooltip>
			<TooltipTrigger asChild>{trigger}</TooltipTrigger>
			<TooltipContent
				sideOffset={6}
				className="border bg-accent font-semibold text-foreground"
			>
				<p>{tooltip}</p>
			</TooltipContent>
		</Tooltip>
	);
}
