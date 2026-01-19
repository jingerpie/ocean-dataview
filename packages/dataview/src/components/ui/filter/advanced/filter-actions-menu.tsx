"use client";

import {
	CopyIcon,
	MoreHorizontalIcon,
	SquareStackIcon,
	TrashIcon,
	Undo2Icon,
} from "lucide-react";
import { Button } from "../../button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../../dropdown-menu";

interface FilterActionsMenuProps {
	/** Callback to remove this item */
	onRemove: () => void;
	/** Callback to duplicate this item */
	onDuplicate: () => void;
	/** Callback to wrap this item in a group (shows action if provided) */
	onWrapInGroup?: () => void;
	/** Label for wrap action (defaults to "Wrap in group") */
	wrapLabel?: string;
	/** Callback to unwrap/turn into filter (shows action if provided) */
	onUnwrap?: () => void;
	/** Label for unwrap action (defaults to "Turn into filter") */
	unwrapLabel?: string;
	/** Additional class names */
	className?: string;
}

/**
 * Unified actions menu for filter rules and groups.
 * Shows Remove, Duplicate, and optionally Wrap/Unwrap actions.
 */
export function FilterActionsMenu({
	onRemove,
	onDuplicate,
	onWrapInGroup,
	wrapLabel = "Wrap in group",
	onUnwrap,
	unwrapLabel = "Turn into filter",
	className,
}: FilterActionsMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={<Button className={className} size="icon-sm" variant="ghost" />}
			>
				<MoreHorizontalIcon className="size-4" />
				<span className="sr-only">Actions</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-auto">
				<DropdownMenuItem onClick={onRemove} variant="destructive">
					<TrashIcon className="size-4" />
					<span>Remove</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={onDuplicate}>
					<CopyIcon className="size-4" />
					<span>Duplicate</span>
				</DropdownMenuItem>

				{onUnwrap && (
					<DropdownMenuItem onClick={onUnwrap}>
						<Undo2Icon className="size-4" />
						<span>{unwrapLabel}</span>
					</DropdownMenuItem>
				)}

				{onWrapInGroup && (
					<DropdownMenuItem onClick={onWrapInGroup}>
						<SquareStackIcon className="size-4" />
						{wrapLabel === "Wrap in group" ? (
							<div className="flex flex-col">
								<span>{wrapLabel}</span>
								<span className="text-muted-foreground text-xs">
									Create a filter group around this
								</span>
							</div>
						) : (
							<span>{wrapLabel}</span>
						)}
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export type { FilterActionsMenuProps };
