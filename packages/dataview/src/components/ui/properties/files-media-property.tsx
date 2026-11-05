"use client";

import { FileIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "../../../lib/utils";
import { Skeleton } from "../skeleton";

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
    return null;
  }

  if (typeof value === "string") {
    return renderFile(value, className);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return null;
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
  if (!checkIsImage(url)) {
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

  return <ImageThumbnail className={className} url={url} />;
}

interface ImageThumbnailProps {
  className?: string;
  url: string;
}

function ImageThumbnail({ url, className }: ImageThumbnailProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <a
      className={cn(
        "relative inline-block h-[26px] min-w-[26px] shrink-0 overflow-hidden rounded align-top hover:opacity-80",
        className
      )}
      href={url}
      onClick={(e) => e.stopPropagation()}
      rel="noopener noreferrer"
      target="_blank"
    >
      {!isLoaded && <Skeleton className="absolute inset-0 rounded" />}
      <Image
        alt="Media"
        className={cn(
          "h-[26px] w-auto object-contain transition-opacity",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        height={0}
        onLoad={() => setIsLoaded(true)}
        src={url}
        width={0}
      />
    </a>
  );
}

function checkIsImage(url: string): boolean {
  if (IMAGE_EXTENSION_REGEX.test(url)) {
    return true;
  }

  if (NON_IMAGE_EXTENSION_REGEX.test(url)) {
    return false;
  }

  return !ANY_EXTENSION_REGEX.test(url);
}
