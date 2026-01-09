"use client";

import { Card, CardContent } from "@ocean-dataview/dataview/components/ui/card";
import { Skeleton } from "@ocean-dataview/dataview/components/ui/skeleton";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import { getBoardCardDimensions } from "../../../lib/utils/get-card-sizes";

interface BoardSkeletonProps extends React.ComponentProps<"div"> {
	/**
	 * Number of columns to display
	 * @default 4
	 */
	columnCount?: number;
	/**
	 * Number of cards per column
	 * @default 3
	 */
	cardsPerColumn?: number;
	/**
	 * Card size preset
	 * @default "medium"
	 */
	cardSize?: "small" | "medium" | "large";
	/**
	 * Show image placeholder in cards
	 * @default true
	 */
	withImage?: boolean;
	/**
	 * Number of property lines per card
	 * @default 2
	 */
	propertyCount?: number;
}

export function BoardSkeleton({
	columnCount = 4,
	cardsPerColumn = 3,
	cardSize = "medium",
	withImage = true,
	propertyCount = 2,
	className,
	...props
}: BoardSkeletonProps) {
	const { imageHeight, columnWidth } = getBoardCardDimensions(cardSize);

	return (
		<div
			className={cn("flex gap-4 overflow-x-auto pb-4", className)}
			{...props}
		>
			{Array.from({ length: columnCount }).map((_, colIndex) => (
				<div
					key={colIndex}
					className={cn("flex shrink-0 flex-col gap-3", columnWidth)}
				>
					{/* Column Header */}
					<div className="flex items-center gap-2 px-2 py-1">
						<Skeleton className="h-6 w-20" />
						<Skeleton className="h-5 w-6 rounded-full" />
					</div>

					{/* Cards */}
					<div className="flex flex-col gap-3">
						{Array.from({ length: cardsPerColumn }).map((_, cardIndex) => (
							<Card key={cardIndex} className="gap-0 overflow-hidden py-0">
								{/* Image placeholder */}
								{withImage && (
									<Skeleton
										className="w-full rounded-none"
										style={{ height: imageHeight }}
									/>
								)}

								{/* Card content */}
								<CardContent className="flex flex-col gap-2 p-3">
									{Array.from({ length: propertyCount }).map((_, j) => (
										<Skeleton
											key={j}
											className="h-4"
											style={{ width: j === 0 ? "80%" : "60%" }}
										/>
									))}
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
