"use client";

import type { UrlPropertyType } from "../../../types/property-types";

interface UrlPropertyProps<T> {
  value: unknown;
  property: UrlPropertyType<T>;
}

export function UrlProperty<T>({ value, property }: UrlPropertyProps<T>) {
  if (!value) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const url = String(value);
  const showFullUrl = property.config?.showFullUrl ?? false;

  let displayText = url;
  if (!showFullUrl) {
    try {
      const urlObj = new URL(url);
      displayText = urlObj.hostname.replace("www.", "");
    } catch {
      // If URL parsing fails, use truncated version
      displayText = url.length > 30 ? `${url.substring(0, 30)}...` : url;
    }
  }

  return (
    <a
      className="inline-flex items-center gap-1 text-sm hover:underline"
      href={url}
      onClick={(e) => e.stopPropagation()}
      rel="noopener noreferrer"
      target="_blank"
    >
      <span className="truncate">{displayText}</span>
    </a>
  );
}
