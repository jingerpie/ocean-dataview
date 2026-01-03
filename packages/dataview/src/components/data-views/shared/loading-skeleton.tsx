"use client";

import { Skeleton } from "@ocean-dataview/dataview/components/ui/skeleton";

interface LoadingSkeletonProps {
	variant?: "table" | "card" | "list";
	rows?: number;
}

/**
 * Reusable loading skeleton for different view types
 */
export function LoadingSkeleton({
	variant = "table",
	rows = 5,
}: LoadingSkeletonProps) {
	if (variant === "table") {
		return (
			<div className="flex flex-col gap-3">
				{/* Header */}
				<div className="flex gap-4 border-b pb-2">
					<Skeleton className="h-4 w-[150px]" />
					<Skeleton className="h-4 w-[120px]" />
					<Skeleton className="h-4 w-[100px]" />
					<Skeleton className="h-4 flex-1" />
				</div>
				{/* Rows */}
				{Array.from({ length: rows }, (_, i) => i).map((rowIndex) => (
					<div key={`table-skeleton-${rowIndex}`} className="flex gap-4">
						<Skeleton className="h-4 w-[150px]" />
						<Skeleton className="h-4 w-[120px]" />
						<Skeleton className="h-4 w-[100px]" />
						<Skeleton className="h-4 flex-1" />
					</div>
				))}
			</div>
		);
	}

	if (variant === "card") {
		return (
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: rows }, (_, i) => i).map((cardIndex) => (
					<div
						key={`card-skeleton-${cardIndex}`}
						className="flex flex-col gap-3 rounded-lg border p-4"
					>
						<Skeleton className="h-[200px] w-full" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
					</div>
				))}
			</div>
		);
	}

	if (variant === "list") {
		return (
			<div className="flex flex-col gap-3">
				{Array.from({ length: rows }, (_, i) => i).map((listIndex) => (
					<div
						key={`list-skeleton-${listIndex}`}
						className="flex flex-col gap-2 rounded-lg border p-4"
					>
						<Skeleton className="h-5 w-1/3" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-2/3" />
					</div>
				))}
			</div>
		);
	}

	return null;
}
