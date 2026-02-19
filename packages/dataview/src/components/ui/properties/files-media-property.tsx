"use client";

import { FileIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "../../../lib/utils";

// Regex patterns compiled at module level for performance
const IMAGE_EXTENSION_REGEX = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|#|$)/i;
const NON_IMAGE_EXTENSION_REGEX =
  /\.(pdf|doc|docx|xls|xlsx|zip|txt|csv|mp4|mov|avi)(\?|#|$)/i;
const ANY_EXTENSION_REGEX = /\.\w+(\?|#|$)/;

interface FilesMediaPropertyProps {
  className?: string;
  value: string | string[] | null | undefined;
}

export function FilesMediaProperty({
  value,
  className,
}: FilesMediaPropertyProps) {
  if (!value) {
    return (
      <span className={cn("text-muted-foreground text-sm", className)}>-</span>
    );
  }

  // Handle single URL string
  if (typeof value === "string") {
    return renderFile(value, className);
  }

  // Handle array of URLs
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <span className={cn("text-muted-foreground text-sm", className)}>
          -
        </span>
      );
    }

    return (
      <div className={cn("flex gap-2", className)}>
        {value.map((url) => (
          <div className="shrink-0" key={url}>
            {renderFile(url)}
          </div>
        ))}
      </div>
    );
  }

  return <span className={cn("text-sm", className)}>{String(value)}</span>;
}

function renderFile(url: string, className?: string) {
  const isImage = checkIsImage(url);

  // Non-image files: show file icon
  if (!isImage) {
    return (
      <a
        className={cn(
          "inline-flex h-[26px] w-[26px] items-center justify-center rounded border border-border bg-muted hover:bg-muted/80",
          className
        )}
        href={url}
        onClick={(e) => e.stopPropagation()}
        rel="noopener noreferrer"
        target="_blank"
      >
        <FileIcon className="h-4 w-4 text-muted-foreground" />
      </a>
    );
  }

  // Image files: show image thumbnail
  return (
    <a
      className={cn(
        "relative inline-block h-[26px] w-[26px] overflow-hidden rounded align-top hover:opacity-80",
        className
      )}
      href={url}
      onClick={(e) => e.stopPropagation()}
      rel="noopener noreferrer"
      target="_blank"
    >
      <Image
        alt="Media"
        className="object-cover"
        fill
        sizes="(max-width: 768px) 100vw, 200px"
        src={url}
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
