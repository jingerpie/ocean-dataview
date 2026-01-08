"use client";

import type { PaginationContext } from "@ocean-dataview/dataview/lib/data-views/types";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

type InfiniteScrollPaginationProps = Partial<PaginationContext>;

/**
 * InfiniteScrollPagination component for automatic loading.
 * Uses Intersection Observer to detect when user scrolls near the sentinel element.
 */
export function InfiniteScrollPagination({
	hasNext = false,
	onNext,
	isLoading = false,
}: InfiniteScrollPaginationProps) {
	const sentinelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel || !onNext || !hasNext) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry?.isIntersecting && hasNext && !isLoading) {
					onNext();
				}
			},
			{
				rootMargin: "100px", // Trigger 100px before reaching the sentinel
				threshold: 0,
			},
		);

		observer.observe(sentinel);

		return () => {
			observer.disconnect();
		};
	}, [hasNext, isLoading, onNext]);

	// Don't render if no more items
	if (!hasNext && !isLoading) {
		return null;
	}

	return (
		<div ref={sentinelRef} className="flex items-center justify-center py-4">
			{isLoading && (
				<div className="flex items-center gap-2 text-muted-foreground">
					<Loader2 className="h-4 w-4 animate-spin" />
					<span className="text-sm">Loading...</span>
				</div>
			)}
		</div>
	);
}
