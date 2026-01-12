"use client";

import { cn } from "@ocean-dataview/dataview/lib/utils";
import {
	CopyIcon,
	MoreHorizontalIcon,
	SquareStackIcon,
	TrashIcon,
} from "lucide-react";
import { Button } from "../button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../dropdown-menu";

interface RuleActionsMenuProps {
	/** Current nesting level (0 = root, 1, 2) */
	level: 0 | 1 | 2;
	/** Whether wrapping in group is allowed (false at max depth) */
	canWrapInGroup: boolean;
	/** Callback to remove this rule */
	onRemove: () => void;
	/** Callback to duplicate this rule */
	onDuplicate: () => void;
	/** Callback to wrap this rule in a new group */
	onWrapInGroup: () => void;
	/** Additional class names */
	className?: string;
}

/**
 * Three-dot actions menu for a filter rule.
 * Shows Remove, Duplicate, and optionally Wrap in Group actions.
 */
export function RuleActionsMenu({
	level,
	canWrapInGroup,
	onRemove,
	onDuplicate,
	onWrapInGroup,
	className,
}: RuleActionsMenuProps) {
	// Text varies based on level
	const wrapLabel = level === 0 ? "Wrap in group" : "Turn into group";
	const wrapDescription =
		level === 0 ? "Create a filter group around this" : undefined;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						className={cn("size-7 text-muted-foreground", className)}
					/>
				}
			>
				<MoreHorizontalIcon className="size-4" />
				<span className="sr-only">Filter actions</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuItem onClick={onRemove}>
					<TrashIcon className="size-4" />
					<span>Remove</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={onDuplicate}>
					<CopyIcon className="size-4" />
					<span>Duplicate</span>
				</DropdownMenuItem>
				{canWrapInGroup && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={onWrapInGroup}
							className="flex-col items-start"
						>
							<div className="flex items-center gap-2">
								<SquareStackIcon className="size-4" />
								<span>{wrapLabel}</span>
							</div>
							{wrapDescription && (
								<span className="ml-6 text-muted-foreground text-xs">
									{wrapDescription}
								</span>
							)}
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
