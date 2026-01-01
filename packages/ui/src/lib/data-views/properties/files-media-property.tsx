"use client";

import { FileIcon } from "lucide-react";
import Image from "next/image";
import { EmptyValue } from "../components/empty-value";
import type { FilesMediaPropertyType } from "../types/property-types";

// Regex patterns compiled at module level for performance
const IMAGE_EXTENSION_REGEX = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|#|$)/i;
const NON_IMAGE_EXTENSION_REGEX =
	/\.(pdf|doc|docx|xls|xlsx|zip|txt|csv|mp4|mov|avi)(\?|#|$)/i;
const ANY_EXTENSION_REGEX = /\.\w+(\?|#|$)/;

// Thumbnail dimensions for different contexts
const THUMBNAIL_SIZE = 26; // Standard thumbnail size for compact display

interface FilesMediaPropertyProps<T> {
	value: unknown;
	property: FilesMediaPropertyType<T>;
	wrap?: boolean;
}

export function FilesMediaProperty<T>({
	value,
	wrap = false,
}: FilesMediaPropertyProps<T>) {
	if (!value) {
		return <EmptyValue />;
	}

	// Handle single URL string
	if (typeof value === "string") {
		return renderFile(value);
	}

	// Handle array of URLs
	if (Array.isArray(value)) {
		if (value.length === 0) {
			return <EmptyValue />;
		}

		// In table/list context, show all files - wrap if wrap prop is true, otherwise inline
		return (
			<div className={wrap ? "flex flex-wrap gap-2" : "flex gap-2"}>
				{value.map((url) => (
					<div key={url} className="flex-shrink-0">
						{renderFile(url)}
					</div>
				))}
			</div>
		);
	}

	return <span className="text-sm">{String(value)}</span>;
}

function renderFile(url: string) {
	const isImage = checkIsImage(url);
	const dimensions = getDimensions();

	// Non-image files: show file icon
	if (!isImage) {
		return (
			<a
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				className="inline-flex items-center justify-center rounded border border-border bg-muted hover:bg-muted/80"
				style={{ width: dimensions.width, height: dimensions.height }}
				onClick={(e) => e.stopPropagation()}
			>
				<FileIcon className="h-4 w-4 text-muted-foreground" />
			</a>
		);
	}

	// Image files: show image thumbnail
	// Always maintain original aspect ratio with height constraint
	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-block overflow-hidden rounded align-top hover:opacity-80"
			onClick={(e) => e.stopPropagation()}
		>
			<Image
				src={url}
				alt="Media"
				width={dimensions.width}
				height={dimensions.height}
				className="block object-contain"
				style={{ height: dimensions.height, width: "auto" }}
			/>
		</a>
	);
}

function checkIsImage(url: string): boolean {
	// Check for known image extensions (with query params/fragments)
	if (IMAGE_EXTENSION_REGEX.test(url)) return true;

	// Check for known non-image extensions
	if (NON_IMAGE_EXTENSION_REGEX.test(url)) return false;

	// If no extension found (e.g., Unsplash URLs), treat as image
	return !ANY_EXTENSION_REGEX.test(url);
}

function getDimensions() {
	// Consistent size for all contexts
	return { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE };
}
