"use client";

import type { PhoneConfig } from "../../../types/property-types";

interface PhonePropertyProps {
  value: unknown;
  config?: PhoneConfig;
}

export function PhoneProperty({
  value,
  config: { showAsLink = true, format = "none" } = {},
}: PhonePropertyProps) {
  if (!value) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const phone = String(value);

  let formattedPhone = phone;

  // Format phone number
  if (format === "US") {
    // Format as (XXX) XXX-XXXX
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      formattedPhone = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === "1") {
      formattedPhone = `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
  } else if (format === "international" && !phone.startsWith("+")) {
    // Keep as is but ensure it starts with +
    formattedPhone = `+${phone}`;
  }

  if (!showAsLink) {
    return <span className="text-sm">{formattedPhone}</span>;
  }

  return (
    <a
      className="inline-flex items-center gap-1 text-sm hover:underline"
      href={`tel:${phone}`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="truncate">{formattedPhone}</span>
    </a>
  );
}
