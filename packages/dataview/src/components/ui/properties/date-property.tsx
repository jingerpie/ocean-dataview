"use client";

import type { Locale } from "date-fns";
import {
  differenceInDays,
  format,
  formatDistanceToNow,
  startOfDay,
} from "date-fns";
// biome-ignore lint/performance/noNamespaceImport: Dynamic locale lookup requires all locales
import * as locales from "date-fns/locale";
import { useMemo } from "react";
import type { DateConfig } from "../../../types/property.type";
import { getUserLocale } from "../../../utils/locale-helpers";

/**
 * Get the date-fns locale object for a given locale string
 * Converts locale codes like "en-US", "zh-CN", "ja-JP" to date-fns locale keys like "enUS", "zhCN", "ja"
 */
function getDateFnsLocale(localeString: string): Locale {
  // Convert locale string to date-fns locale key format
  // "en-US" -> "enUS", "zh-CN" -> "zhCN", "ja-JP" -> "ja", "de-DE" -> "de"
  const localeKey = localeString.replace(/-/g, "");

  // Build a map of all available locales
  const localeMap = locales as Record<string, Locale>;

  // Try exact match first (e.g., "enUS", "zhCN")
  if (localeMap[localeKey]) {
    return localeMap[localeKey];
  }

  // Try language code only (e.g., "en", "zh", "ja", "de")
  const langCode = localeString.split("-")[0];
  if (langCode && localeMap[langCode]) {
    return localeMap[langCode];
  }

  // Fallback to English
  return locales.enUS;
}

/**
 * Format a date as a relative group label.
 * Used for group headers when showAs="relative".
 *
 * The date represents the START of a bucket:
 * - Today's date = "Today"
 * - Yesterday's date = "Yesterday"
 * - Tomorrow's date = "Tomorrow"
 * - 7 days ago = "Last 7 days"
 * - 2 days ahead = "Next 7 days"
 * - 30 days ago = "Last 30 days"
 * - 8 days ahead = "Next 30 days"
 * - First of month = "MMM yyyy" (e.g., "Aug 2025")
 */
function formatRelativeGroupLabel(date: Date, locale: Locale): string {
  const today = startOfDay(new Date());
  const targetDay = startOfDay(date);
  const diffDays = differenceInDays(targetDay, today);

  // Match bucket start dates to labels
  // These must match the server-side bucket boundaries in group-columns.ts
  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === -1) {
    return "Yesterday";
  }
  if (diffDays === 1) {
    return "Tomorrow";
  }
  if (diffDays === -7) {
    return "Last 7 days";
  }
  if (diffDays === 2) {
    return "Next 7 days";
  }
  if (diffDays === -30) {
    return "Last 30 days";
  }
  if (diffDays === 8) {
    return "Next 30 days";
  }

  // Fallback: format as month/year
  return format(date, "MMM yyyy", { locale });
}

interface DatePropertyProps {
  config?: DateConfig;
  value: Date | string | null;
}

/**
 * Displays date values with locale-aware formatting
 * Supports various date formats and relative time display
 * @param value - Date object from database (Drizzle returns Date, SuperJSON preserves it)
 * @param config - Date configuration with date/time format settings
 * @returns Formatted date string or empty value
 */
export function DateProperty({
  value,
  config: { dateFormat = "full", timeFormat = "12hour" } = {},
}: DatePropertyProps) {
  const userLocale = getUserLocale();
  const dateFnsLocale = getDateFnsLocale(userLocale);

  // Memoize formatted date - formatting is expensive
  const formattedDate = useMemo(() => {
    if (!value) {
      return null;
    }

    // Convert string to Date if needed
    const dateValue = typeof value === "string" ? new Date(value) : value;

    // Check for invalid date
    if (Number.isNaN(dateValue.getTime())) {
      return null;
    }

    let formatted: string;

    // Format date with locale support
    switch (dateFormat) {
      case "full":
        formatted = format(dateValue, "MMMM d, yyyy", {
          locale: dateFnsLocale,
        });
        break;
      case "short":
        formatted = format(dateValue, "MMM d, yyyy", { locale: dateFnsLocale });
        break;
      case "MDY":
        formatted = format(dateValue, "MM/dd/yyyy", { locale: dateFnsLocale });
        break;
      case "DMY":
        formatted = format(dateValue, "dd/MM/yyyy", { locale: dateFnsLocale });
        break;
      case "YMD":
        formatted = format(dateValue, "yyyy-MM-dd", { locale: dateFnsLocale });
        break;
      case "relative":
        formatted = formatDistanceToNow(dateValue, {
          addSuffix: true,
          locale: dateFnsLocale,
        });
        break;
      case "relativeGroup":
        // Used for group headers - converts bucket start date to label
        formatted = formatRelativeGroupLabel(dateValue, dateFnsLocale);
        break;
      default:
        formatted = format(dateValue, "MMM d, yyyy", { locale: dateFnsLocale });
    }

    // Add time if not hidden (except for relative formats)
    if (
      timeFormat !== "hidden" &&
      dateFormat !== "relative" &&
      dateFormat !== "relativeGroup"
    ) {
      const timeFormatString = timeFormat === "12hour" ? "h:mm a" : "HH:mm";
      formatted += ` ${format(dateValue, timeFormatString, { locale: dateFnsLocale })}`;
    }

    return formatted;
  }, [value, dateFormat, timeFormat, dateFnsLocale]);

  if (!formattedDate) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return <span className="whitespace-nowrap text-sm">{formattedDate}</span>;
}
