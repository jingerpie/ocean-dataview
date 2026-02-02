"use client";

import { FileIcon } from "lucide-react";
import Image from "next/image";

// Regex patterns compiled at module level for performance
const IMAGE_EXTENSION_REGEX = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|#|$)/i;
const NON_IMAGE_EXTENSION_REGEX =
  /\.(pdf|doc|docx|xls|xlsx|zip|txt|csv|mp4|mov|avi)(\?|#|$)/i;
const ANY_EXTENSION_REGEX = /\.\w+(\?|#|$)/;

// Thumbnail dimensions for different contexts
const THUMBNAIL_SIZE = 26; // Standard thumbnail size for compact display

interface FilesMediaPropertyProps {
  value: unknown;
}

export function FilesMediaProperty({ value }: FilesMediaPropertyProps) {
  if (!value) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  // Handle single URL string
  if (typeof value === "string") {
    return renderFile(value);
  }

  // Handle array of URLs
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground text-sm">-</span>;
    }

    return (
      <div className="flex gap-2">
        {value.map((url) => (
          <div className="shrink-0" key={url}>
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
        className="inline-flex items-center justify-center rounded border border-border bg-muted hover:bg-muted/80"
        href={url}
        onClick={(e) => e.stopPropagation()}
        rel="noopener noreferrer"
        style={{ width: dimensions.width, height: dimensions.height }}
        target="_blank"
      >
        <FileIcon className="h-4 w-4 text-muted-foreground" />
      </a>
    );
  }

  // Image files: show image thumbnail
  // Always maintain original aspect ratio with height constraint
  return (
    <a
      className="inline-block overflow-hidden rounded align-top hover:opacity-80"
      href={url}
      onClick={(e) => e.stopPropagation()}
      rel="noopener noreferrer"
      target="_blank"
    >
      <Image
        alt="Media"
        className="block object-contain"
        height={dimensions.height}
        src={url}
        style={{ height: dimensions.height, width: "auto" }}
        width={dimensions.width}
      />
    </a>
  );
}

function checkIsImage(url: string): boolean {
  // Check for known image extensions (with query params/fragments)
  if (IMAGE_EXTENSION_REGEX.test(url)) {
    return true;
  }

  // Check for known non-image extensions
  if (NON_IMAGE_EXTENSION_REGEX.test(url)) {
    return false;
  }

  // If no extension found (e.g., Unsplash URLs), treat as image
  return !ANY_EXTENSION_REGEX.test(url);
}

function getDimensions() {
  // Consistent size for all contexts
  return { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE };
}
