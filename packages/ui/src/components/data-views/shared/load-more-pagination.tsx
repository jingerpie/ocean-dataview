"use client";

import { Button } from "@ocean-dataview/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ocean-dataview/ui/components/dropdown-menu";
import type { PaginationContext } from "@ocean-dataview/ui/lib/data-views/types";
import { ArrowDown, Loader2 } from "lucide-react";

type LoadMorePaginationProps = Partial<PaginationContext>;

/**
 * LoadMorePagination component for infinite scroll pagination
 * Shows "Load More" button with remaining count and configurable batch size
 */
export function LoadMorePagination({
	onLoadMore,
	isLoading = false,
	remainingCount,
	pageSize,
	onPageSizeChange,
	pageSizeOptions = [10, 25, 50, 100],
}: LoadMorePaginationProps) {
	// Don't show if no callback or no remaining items
	if (!onLoadMore || !remainingCount || remainingCount === 0) {
		return null;
	}

	return (
		<div className="flex items-center border-t">
			<Button
				variant="ghost"
				onClick={onLoadMore}
				disabled={isLoading}
				className="gap-2 px-2 font-normal text-muted-foreground hover:text-foreground"
			>
				{isLoading ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						Loading...
					</>
				) : (
					<>
						<ArrowDown className="h-4 w-4" />
						Load more
					</>
				)}
			</Button>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						disabled={isLoading}
						className="px-2 font-normal text-muted-foreground hover:text-foreground"
					>
						•••
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					<DropdownMenuLabel>Show on first load</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{pageSizeOptions.map((size) => (
						<DropdownMenuItem
							key={size}
							onClick={() => onPageSizeChange?.(size)}
						>
							<span className="flex w-full items-center justify-between">
								{size} pages
								{pageSize === size && <span className="ml-4">✓</span>}
							</span>
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
