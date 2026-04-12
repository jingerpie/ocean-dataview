"use client";

import { useMemo } from "react";
import { cn } from "../../../lib/utils";
import type { NumberConfig } from "../../../types/property.type";
import {
  getBadgeBgVar,
  getBadgeForegroundVar,
} from "../../../utils/badge-colors";
import { getUserLocale } from "../../../utils/locale-helpers";

interface NumberPropertyProps {
  config?: NumberConfig;
  value: number | null;
}

/**
 * Displays numeric values with configurable formatting
 * Supports number formats, currency symbols, and visual representations (bar/ring)
 * @param value - The numeric value to display
 * @param config - Number configuration with format settings
 * @returns Formatted number, currency, or visual progress indicator
 */
export function NumberProperty({
  value,
  config: {
    decimalPlaces = 0,
    numberFormat = "number",
    scale,
    showAs: {
      type: showAsType = "number",
      color = "green",
      divideBy = 100,
      showNumber = true,
    } = {},
  } = {},
}: NumberPropertyProps) {
  // Parse numeric value - must be called unconditionally
  const rawValue = typeof value === "number" ? value : Number(value);
  // Apply scale (e.g. cents → dollars when scale=100)
  const numValue = scale ? rawValue / scale : rawValue;

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

  const cssColor = getBadgeForegroundVar(color);
  const isSubtle = color.endsWith("-subtle");
  const cssBgColor = isSubtle ? getBadgeBgVar(color) : undefined;

  // Bar visualization
  if (showAsType === "bar") {
    const percentage = (numValue / divideBy) * 100;
    const clampedPercentage = Math.min(100, Math.max(0, percentage));

    return (
      <div className="flex w-full items-center gap-2">
        {showNumber && (
          <span className="whitespace-nowrap text-sm">{formattedValue}</span>
        )}
        <div
          className={cn(
            "h-1 flex-1 overflow-hidden rounded-full",
            !isSubtle && "bg-muted"
          )}
          style={isSubtle ? { backgroundColor: cssBgColor } : undefined}
        >
          <div
            className="h-full transition-all"
            style={{
              width: `${clampedPercentage}%`,
              backgroundColor: cssColor,
            }}
          />
        </div>
      </div>
    );
  }

  // Ring visualization
  if (showAsType === "ring") {
    const percentage = (numValue / divideBy) * 100;
    const clampedPercentage = Math.min(100, Math.max(0, percentage));
    const radius = 8;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset =
      circumference - (clampedPercentage / 100) * circumference;

    return (
      <div className="flex items-center gap-2">
        {showNumber && <span className="text-sm">{formattedValue}</span>}
        <svg
          aria-label={`Progress: ${clampedPercentage}%`}
          className="-rotate-90 transform"
          height="22"
          role="img"
          width="22"
        >
          <title>{`Progress: ${clampedPercentage}%`}</title>
          <circle
            className={isSubtle ? undefined : "text-muted"}
            cx="11"
            cy="11"
            fill="none"
            r={radius}
            stroke={isSubtle ? cssBgColor : "currentColor"}
            strokeWidth="4"
          />
          <circle
            cx="11"
            cy="11"
            fill="none"
            r={radius}
            stroke={cssColor}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
      </div>
    );
  }

  // Default number display
  return (
    <span className={cn("text-right text-sm tabular-nums")}>
      {formattedValue}
    </span>
  );
}
