"use client";

import { Mail } from "lucide-react";
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
      className="inline-flex items-center gap-1 text-blue-600 text-sm hover:text-blue-800 hover:underline"
      href={`mailto:${email}`}
      onClick={(e) => e.stopPropagation()}
    >
      <Mail className="h-3 w-3 flex-shrink-0" />
      <span className="truncate">{email}</span>
    </a>
  );
}
