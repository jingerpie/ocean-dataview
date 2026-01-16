"use client";

import { cn } from "@ocean-dataview/dataview/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "../dropdown-menu";

interface LogicConnectorProps {
	/** Whether this is the first rule (shows "Where" label) */
	isFirst: boolean;
	/** Whether this is the second rule (shows dropdown, can change logic) */
	isSecond: boolean;
	/** Current logic operator */
	logic: "and" | "or";
	/** Callback when logic changes */
	onLogicChange: (logic: "and" | "or") => void;
	/** Additional class names */
	className?: string;
}

/**
 * Logic connector for filter rules.
 * - First rule shows static "Where" label
 * - Second rule shows "And" / "Or" dropdown (can change logic for entire group)
 * - Third+ rules show static "And" / "Or" label
 */
export function LogicConnector({
	isFirst,
	isSecond,
	logic,
	onLogicChange,
	className,
}: LogicConnectorProps) {
	// First item shows "Where"
	if (isFirst) {
		return (
			<span
				className={cn(
					"inline-flex h-7 w-14 items-center justify-start font-medium text-muted-foreground text-sm",
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
					"inline-flex h-7 w-14 items-center justify-end pr-2 font-medium text-muted-foreground text-sm capitalize",
					className
				)}
			>
				{logic}
			</span>
		);
	}

	// Second item shows dropdown
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				className={cn(
					"inline-flex h-7 w-14 items-center justify-between gap-1 rounded-md px-2 font-medium text-muted-foreground text-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring",
					className
				)}
			>
				<span className="capitalize">{logic}</span>
				<ChevronDownIcon className="size-3.5 opacity-50" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuRadioGroup
					onValueChange={(value) => onLogicChange(value as "and" | "or")}
					value={logic}
				>
					<DropdownMenuRadioItem className="flex-col items-start" value="and">
						<span className="font-medium">And</span>
						<span className="text-muted-foreground text-xs">
							All filters must match
						</span>
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem className="flex-col items-start" value="or">
						<span className="font-medium">Or</span>
						<span className="text-muted-foreground text-xs">
							At least one filter must match
						</span>
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
