"use client";

import type { Locale } from "date-fns";
import { format, formatDistanceToNow } from "date-fns";
// biome-ignore lint/performance/noNamespaceImport: Dynamic locale lookup requires all locales
import * as locales from "date-fns/locale";
import { useMemo } from "react";
import { getUserLocale } from "../../../lib/utils/locale-helpers";
import type { DateConfig } from "../../../types/property.type";

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

interface DatePropertyProps {
  value: Date | null;
  config?: DateConfig;
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

    let formatted: string;

    // Format date with locale support
    switch (dateFormat) {
      case "full":
        formatted = format(value, "MMMM d, yyyy", { locale: dateFnsLocale });
        break;
      case "short":
        formatted = format(value, "MMM d, yyyy", { locale: dateFnsLocale });
        break;
      case "MDY":
        formatted = format(value, "MM/dd/yyyy", { locale: dateFnsLocale });
        break;
      case "DMY":
        formatted = format(value, "dd/MM/yyyy", { locale: dateFnsLocale });
        break;
      case "YMD":
        formatted = format(value, "yyyy-MM-dd", { locale: dateFnsLocale });
        break;
      case "relative":
        formatted = formatDistanceToNow(value, {
          addSuffix: true,
          locale: dateFnsLocale,
        });
        break;
      default:
        formatted = format(value, "MMM d, yyyy", { locale: dateFnsLocale });
    }

    // Add time if not hidden
    if (timeFormat !== "hidden" && dateFormat !== "relative") {
      const timeFormatString = timeFormat === "12hour" ? "h:mm a" : "HH:mm";
      formatted += ` ${format(value, timeFormatString, { locale: dateFnsLocale })}`;
    }

    return formatted;
  }, [value, dateFormat, timeFormat, dateFnsLocale]);

  if (!formattedDate) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return <span className="whitespace-nowrap text-sm">{formattedDate}</span>;
}
