"use client";

import type { PaginationContext } from "@ocean-dataview/dataview/types";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

type InfiniteScrollPaginationProps = Partial<PaginationContext>;

/**
 * InfiniteScrollPagination component for automatic loading.
 * Uses Intersection Observer to detect when user scrolls near the sentinel element.
 * Data is appended to existing items (not replaced).
 */
export function InfiniteScrollPagination({
	hasNext = false,
	onNext,
	isFetchingNextPage = false,
	error,
}: InfiniteScrollPaginationProps) {
	const sentinelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!(sentinel && onNext && hasNext)) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				// Only trigger if not already fetching
				if (entry?.isIntersecting && hasNext && !isFetchingNextPage) {
					onNext();
				}
			},
			{
				rootMargin: "100px", // Trigger 100px before reaching the sentinel
				threshold: 0,
			}
		);

		observer.observe(sentinel);

		return () => {
			observer.disconnect();
		};
	}, [hasNext, isFetchingNextPage, onNext]);

	// Don't render if no more items and not loading
	if (!(hasNext || isFetchingNextPage)) {
		return null;
	}

	return (
		<div className="flex items-center justify-center py-4" ref={sentinelRef}>
			{error && <p className="text-destructive text-sm">Failed to load</p>}
			{isFetchingNextPage && (
				<div className="flex items-center gap-2 text-muted-foreground">
					<Loader2 className="h-4 w-4 animate-spin" />
					<span className="text-sm">Loading...</span>
				</div>
			)}
		</div>
	);
}
