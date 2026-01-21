"use client";

import { ListFilterIcon, MoreHorizontalIcon, TrashIcon } from "lucide-react";
import { Button } from "../../button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../../dropdown-menu";

interface FilterChipActionsProps {
	/** Callback to remove this filter */
	onRemove: () => void;
	/** Callback to add this filter to advanced filter */
	onAddToAdvanced?: () => void;
	/** Additional class names */
	className?: string;
}

/**
 * Actions menu for simple filter chips.
 * Shows Delete and optionally Add to advanced filter.
 */
export function FilterChipActions({
	onRemove,
	onAddToAdvanced,
	className,
}: FilterChipActionsProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={<Button className={className} size="sm" variant="ghost" />}
			>
				<MoreHorizontalIcon />
				<span className="sr-only">Actions</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-auto" side="bottom">
				<DropdownMenuItem onClick={onRemove} variant="destructive">
					<TrashIcon />
					Delete filter
				</DropdownMenuItem>
				{onAddToAdvanced && (
					<DropdownMenuItem onClick={onAddToAdvanced}>
						<ListFilterIcon />
						Add to advanced filter
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export type { FilterChipActionsProps };
