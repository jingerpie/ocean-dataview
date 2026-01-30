"use client";

import { cn } from "@ocean-dataview/dataview/lib/utils";
import { useMemo } from "react";
import { getUserLocale } from "../../../lib/utils/locale-helpers";
import type { NumberPropertyType } from "../../../types/property-types";

interface NumberPropertyProps<T> {
  value: unknown;
  property: NumberPropertyType<T>;
}

/**
 * Displays numeric values with configurable formatting
 * Supports number formats, currency symbols, and visual representations (bar/ring)
 * @param value - The numeric value to display
 * @param property - Property configuration with format settings
 * @returns Formatted number, currency, or visual progress indicator
 */
export function NumberProperty<T>({ value, property }: NumberPropertyProps<T>) {
  // Parse numeric value - must be called unconditionally
  const numValue = typeof value === "number" ? value : Number(value);
  const config = property.config;
  const decimalPlaces = config?.decimalPlaces ?? 0;
  const numberFormat = config?.numberFormat ?? "number";
  const showAs = config?.showAs ?? "number";

  // Get user locale once to avoid repeated lookups - must be called unconditionally
  const userLocale = getUserLocale();

  // Memoize formatted value - must be called unconditionally
  const formattedValue = useMemo(() => {
    switch (numberFormat) {
      case "numberWithCommas":
        return numValue.toLocaleString(userLocale, {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        });
      case "percentage":
        return `${numValue.toFixed(decimalPlaces)}%`;
      case "dollar":
        return `$${numValue.toLocaleString(userLocale, {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        })}`;
      case "euro":
        return `€${numValue.toLocaleString(userLocale, {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        })}`;
      case "pound":
        return `£${numValue.toLocaleString(userLocale, {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        })}`;
      default:
        return numValue.toFixed(decimalPlaces);
    }
  }, [numValue, numberFormat, decimalPlaces, userLocale]);

  // Early return after all hooks
  if (
    value == null ||
    (typeof value !== "number" && Number.isNaN(Number(value)))
  ) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  // If showAs is a bar or ring
  if (typeof showAs === "object") {
    const { showNumber = true } = showAs;
    const percentage = (numValue / showAs.divideBy) * 100;
    const clampedPercentage = Math.min(100, Math.max(0, percentage));

    if (showAs.type === "bar") {
      return (
        <div className="flex w-full items-center gap-2">
          {showNumber && (
            <span className="whitespace-nowrap font-medium text-sm">
              {formattedValue}
            </span>
          )}
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full transition-all"
              style={{
                width: `${clampedPercentage}%`,
                backgroundColor: showAs.color,
              }}
            />
          </div>
        </div>
      );
    }

    if (showAs.type === "ring") {
      const radius = 8;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset =
        circumference - (clampedPercentage / 100) * circumference;

      return (
        <div className="flex items-center gap-2">
          {showNumber && (
            <span className="font-medium text-sm">{formattedValue}</span>
          )}
          <svg
            aria-label={`Progress: ${clampedPercentage}%`}
            className="-rotate-90 transform"
            height="22"
            role="img"
            width="22"
          >
            <title>{`Progress: ${clampedPercentage}%`}</title>
            <circle
              className="text-muted"
              cx="11"
              cy="11"
              fill="none"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
            />
            <circle
              cx="11"
              cy="11"
              fill="none"
              r={radius}
              stroke={showAs.color}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
        </div>
      );
    }
  }

  // Default number display
  return (
    <span className={cn("text-right font-medium text-sm tabular-nums")}>
      {formattedValue}
    </span>
  );
}
