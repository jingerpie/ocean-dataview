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
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../../dropdown-menu";

interface GroupActionsMenuProps {
	/** Number of items in this group */
	itemCount: number;
	/** Whether wrapping in another group is allowed (false at max depth) */
	canWrapInGroup: boolean;
	/** Callback to remove this group */
	onRemove: () => void;
	/** Callback to duplicate this group */
	onDuplicate: () => void;
	/** Callback to unwrap this group (turn into filter) */
	onUnwrap: () => void;
	/** Callback to wrap this group in another group */
	onWrapInGroup: () => void;
	/** Additional class names */
	className?: string;
}

/**
 * Three-dot actions menu for a filter group.
 * Shows Remove, Duplicate, Turn into filter (if 1 item), and Wrap in group actions.
 */
export function GroupActionsMenu({
	itemCount,
	canWrapInGroup,
	onRemove,
	onDuplicate,
	onUnwrap,
	onWrapInGroup,
	className,
}: GroupActionsMenuProps) {
	// "Turn into filter" only available if group has exactly 1 item
	const canUnwrap = itemCount === 1;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={<Button className={className} size="icon-sm" variant="ghost" />}
			>
				<MoreHorizontalIcon className="size-4" />
				<span className="sr-only">Group actions</span>
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

				{(canUnwrap || canWrapInGroup) && <DropdownMenuSeparator />}

				{canUnwrap && (
					<DropdownMenuItem onClick={onUnwrap}>
						<Undo2Icon className="size-4" />
						<span>Turn into filter</span>
					</DropdownMenuItem>
				)}

				{canWrapInGroup && (
					<DropdownMenuItem
						className="flex-col items-start"
						onClick={onWrapInGroup}
					>
						<div className="flex items-center gap-2">
							<SquareStackIcon className="size-4" />
							<span>Wrap in group</span>
						</div>
						<span className="ml-6 text-muted-foreground text-xs">
							Create a filter group around this
						</span>
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export type { GroupActionsMenuProps };
