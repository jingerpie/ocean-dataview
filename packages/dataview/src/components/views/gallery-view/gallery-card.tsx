"use client";

import { Card, CardContent } from "@ocean-dataview/dataview/components/ui/card";
import { PropertyDisplay } from "@ocean-dataview/dataview/lib/data-views/properties";
import type { DataViewProperty } from "@ocean-dataview/dataview/lib/data-views/types";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import { ImageIcon } from "lucide-react";
import Image from "next/image";

export interface GalleryCardProps<TData> {
	/**
	 * Data to display in gallery
	 */
	data: TData[];

	/**
	 * Property definitions for display (excluding preview and groupBy)
	 */
	displayProperties: DataViewProperty<TData>[];

	/**
	 * Card preview property ID (references property.id, not data key)
	 */
	cardPreview?: string;

	/**
	 * Image height in pixels
	 */
	imageHeight: number;

	/**
	 * Grid columns class
	 */
	cols: string;

	/**
	 * Fit image or contain
	 */
	fitImage: boolean;

	/**
	 * Wrap all properties
	 */
	wrapAllProperties: boolean;

	/**
	 * Show property names
	 */
	showPropertyNames: boolean;

	/**
	 * Card click handler
	 */
	onCardClick?: (item: TData) => void;

	/**
	 * Additional className
	 */
	className?: string;
}

/**
 * DataGallery - Core gallery grid component
 * Renders cards in a responsive grid without grouping logic
 */
export function GalleryCard<TData>({
	data,
	displayProperties,
	cardPreview,
	imageHeight,
	cols,
	fitImage,
	wrapAllProperties,
	showPropertyNames,
	onCardClick,
	className,
}: GalleryCardProps<TData>) {
	return (
		<div className={cn("grid gap-4", cols, className)}>
			{data.map((item, index) => {
				// Handle cardPreview - if it's an array, use the first element
				const previewValue = cardPreview
					? (item as Record<string, unknown>)[cardPreview]
					: null;
				const imageUrl = Array.isArray(previewValue)
					? previewValue[0]
					: (previewValue as string);

				// Generate a unique key by combining property values or fallback to index
				const firstProperty = displayProperties[0];
				const uniqueKey = firstProperty
					? `card-${String((item as Record<string, unknown>)[firstProperty.id])}-${index}`
					: `card-${index}`;

				return (
					<Card
						key={uniqueKey}
						className={cn(
							"gap-0 overflow-hidden py-0 transition-all hover:shadow-lg",
							onCardClick && "cursor-pointer",
						)}
						onClick={() => onCardClick?.(item)}
					>
						{/* Image Preview - only show if cardPreview is provided */}
						{cardPreview && (
							<div
								className="relative bg-muted"
								style={{ height: imageHeight }}
							>
								{imageUrl ? (
									<Image
										src={imageUrl}
										alt="Preview"
										fill
										className={cn(
											"transition-opacity",
											fitImage ? "object-cover" : "object-contain",
										)}
										loading="lazy"
									/>
								) : (
									<div className="flex h-full items-center justify-center">
										<ImageIcon className="h-12 w-12 text-muted-foreground/30" />
									</div>
								)}
							</div>
						)}

						{/* Card Content */}
						<CardContent className="flex flex-col gap-2 p-3">
							{displayProperties.map((property, propIndex) => {
								const value = (item as Record<string, unknown>)[property.id];
								const isFirst = propIndex === 0;

								return (
									<div
										key={String(property.id)}
										className={cn(
											"flex flex-col items-start",
											isFirst && "font-medium",
											(property.type === "select" ||
												property.type === "multi-select" ||
												property.type === "status" ||
												property.type === "files-media") &&
												"gap-1",
										)}
									>
										{showPropertyNames && (
											<span className="text-muted-foreground text-xs">
												{property.label ?? String(property.id)}
											</span>
										)}
										<PropertyDisplay
											value={value}
											property={property}
											item={item}
											wrap={wrapAllProperties}
										/>
									</div>
								);
							})}
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
