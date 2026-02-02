"use client";

interface PhonePropertyProps {
  value: unknown;
}

export function PhoneProperty({ value }: PhonePropertyProps) {
  if (!value) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const phone = String(value);

  return (
    <a
      className="inline-flex items-center gap-1 text-sm hover:underline"
      href={`tel:${phone}`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="truncate">{phone}</span>
    </a>
  );
}
