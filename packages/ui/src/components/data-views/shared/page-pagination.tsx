"use client";

import { Button } from "@ocean-dataview/ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ocean-dataview/ui/components/select";
import type { PaginationContext } from "@ocean-dataview/ui/lib/data-views/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PagePaginationProps = Partial<PaginationContext>;

/**
 * PagePagination component with cursor-based navigation
 * Uses Previous/Next buttons instead of page numbers
 */
export function PagePagination({
	hasNext = false,
	hasPrev = false,
	onNext,
	onPrev,
	limit = 25,
	onLimitChange,
	limitOptions = [10, 25, 50, 100],
	isLoading = false,
	displayStart,
	displayEnd,
}: PagePaginationProps) {
	// Don't show if no navigation callbacks
	if (!onNext && !onPrev) {
		return null;
	}

	return (
		<div className="flex items-center justify-between gap-6 px-2">
			{/* Item range display */}
			<div className="flex items-center gap-3">
				<div className="flex gap-1">
					<Button
						variant="outline"
						size="icon-sm"
						onClick={onPrev}
						disabled={!hasPrev || isLoading}
					>
						<ChevronLeft className="h-4 w-4" />
						<span className="sr-only">Previous page</span>
					</Button>
					<Button
						variant="outline"
						size="icon-sm"
						onClick={onNext}
						disabled={!hasNext || isLoading}
					>
						<ChevronRight className="h-4 w-4" />
						<span className="sr-only">Next page</span>
					</Button>
				</div>
				{displayStart !== undefined && displayEnd !== undefined && (
					<div className="text-muted-foreground text-sm">
						{displayEnd > 0 ? (
							<>
								{displayStart}-{displayEnd}
							</>
						) : (
							"No items"
						)}
					</div>
				)}
			</div>
			<div className="flex items-center gap-2">
				<span className="text-muted-foreground text-sm">Rows per page:</span>
				<Select
					value={String(limit)}
					onValueChange={(value) => onLimitChange?.(Number(value))}
				>
					<SelectTrigger className="h-8 w-[70px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{limitOptions.map((size) => (
							<SelectItem key={size} value={String(size)}>
								{size}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
