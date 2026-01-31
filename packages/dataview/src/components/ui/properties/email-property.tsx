"use client";

import type { EmailConfig } from "../../../types/property-types";

interface EmailPropertyProps {
  value: unknown;
  config?: EmailConfig;
}

export function EmailProperty({
  value,
  config: { showAsLink = true } = {},
}: EmailPropertyProps) {
  if (!value) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const email = String(value);

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
