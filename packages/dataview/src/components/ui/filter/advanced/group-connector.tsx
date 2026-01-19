"use client";

import { cn } from "@ocean-dataview/dataview/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "../../dropdown-menu";

interface GroupConnectorProps {
	/** Current logic operator connecting this group to siblings */
	logic: "and" | "or";
	/** Callback when logic changes */
	onLogicChange: (logic: "and" | "or") => void;
	/** Whether this is the first item (shows "Where") */
	isFirst: boolean;
	/** Whether this is the second item (shows dropdown) */
	isSecond: boolean;
	/** Additional class names */
	className?: string;
}

/**
 * Connector dropdown that sits outside a nested group container.
 * Controls how the group relates to its siblings in the parent.
 * - First item shows "Where"
 * - Second item shows dropdown (can change logic)
 * - Third+ items show static label
 */
export function GroupConnector({
	logic,
	onLogicChange,
	isFirst,
	isSecond,
	className,
}: GroupConnectorProps) {
	// First item shows "Where"
	if (isFirst) {
		return (
			<span
				className={cn(
					"inline-flex h-7 w-14 shrink-0 items-center justify-start font-medium text-muted-foreground text-sm",
					className
				)}
			>
				Where
			</span>
		);
	}

	// Third+ items show static label
	if (!isSecond) {
		return (
			<span
				className={cn(
					"inline-flex h-7 w-14 shrink-0 items-center justify-end pr-2 font-medium text-muted-foreground text-sm capitalize",
					className
				)}
			>
				{logic}
			</span>
		);
	}

	// Second item shows dropdown
	return (
		<div className={cn("flex h-7 w-14 shrink-0 items-center", className)}>
			<DropdownMenu>
				<DropdownMenuTrigger
					className={cn(
						"inline-flex h-6 items-center gap-0.5 rounded px-1.5 font-medium text-muted-foreground text-xs hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring"
					)}
				>
					<span className="capitalize">{logic}</span>
					<ChevronDownIcon className="size-3 opacity-50" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					<DropdownMenuRadioGroup
						onValueChange={(value) => onLogicChange(value as "and" | "or")}
						value={logic}
					>
						<DropdownMenuRadioItem className="flex-col items-start" value="and">
							<span className="font-medium">And</span>
							<span className="text-muted-foreground text-xs">
								All conditions in this group must match
							</span>
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem className="flex-col items-start" value="or">
							<span className="font-medium">Or</span>
							<span className="text-muted-foreground text-xs">
								At least one condition must match
							</span>
						</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
