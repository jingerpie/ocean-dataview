"use client";

import type { EmailPropertyType } from "../../../types/property-types";

interface EmailPropertyProps<T> {
  value: unknown;
  property: EmailPropertyType<T>;
}

export function EmailProperty<T>({ value, property }: EmailPropertyProps<T>) {
  if (!value) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const email = String(value);
  const showAsLink = property.config?.showAsLink ?? true;

  if (!showAsLink) {
    return <span className="text-sm">{email}</span>;
  }

  return (
    <a
      className="inline-flex items-center gap-1 text-sm hover:underline"
      href={`mailto:${email}`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="truncate">{email}</span>
    </a>
  );
}
