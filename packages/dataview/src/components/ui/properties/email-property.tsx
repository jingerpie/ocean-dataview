"use client";

interface EmailPropertyProps {
  value: string | null;
}

export function EmailProperty({ value }: EmailPropertyProps) {
  if (!value) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const email = String(value);

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
