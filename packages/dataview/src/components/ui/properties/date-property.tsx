"use client";

import type { Locale } from "date-fns";
import { format, formatDistanceToNow, parseISO } from "date-fns";
// biome-ignore lint/performance/noNamespaceImport: Dynamic locale lookup requires all locales
import * as locales from "date-fns/locale";
import { useMemo } from "react";
import { getUserLocale } from "../../../lib/utils/locale-helpers";
import type { DatePropertyType } from "../../../types/property-types";

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

interface DatePropertyProps<T> {
	value: unknown;
	property: DatePropertyType<T>;
}

/**
 * Displays date values with locale-aware formatting
 * Supports various date formats and relative time display
 * @param value - Date as Date object, ISO string, or timestamp
 * @param property - Property configuration with date/time format settings
 * @returns Formatted date string or empty value
 */
export function DateProperty<T>({ value, property }: DatePropertyProps<T>) {
	// Parse date value - must be called unconditionally
	const date = useMemo(() => {
		if (!value) {
			return null;
		}

		try {
			if (value instanceof Date) {
				return value;
			}
			if (typeof value === "string") {
				return parseISO(value);
			}
			if (typeof value === "number") {
				return new Date(value);
			}
			throw new Error("Invalid date");
		} catch {
			return null;
		}
	}, [value]);

	// Get config and locale - must be called unconditionally
	const config = property.config;
	const dateFormat = config?.dateFormat ?? "short";
	const timeFormat = config?.timeFormat ?? "hidden";
	const userLocale = getUserLocale();
	const dateFnsLocale = getDateFnsLocale(userLocale);

	// Memoize formatted date - must be called unconditionally
	const formattedDate = useMemo(() => {
		if (!date || Number.isNaN(date.getTime())) {
			return null;
		}

		let formatted: string;

		// Format date with locale support
		switch (dateFormat) {
			case "full":
				formatted = format(date, "MMMM d, yyyy", { locale: dateFnsLocale });
				break;
			case "short":
				formatted = format(date, "MMM d, yyyy", { locale: dateFnsLocale });
				break;
			case "MDY":
				formatted = format(date, "MM/dd/yyyy", { locale: dateFnsLocale });
				break;
			case "DMY":
				formatted = format(date, "dd/MM/yyyy", { locale: dateFnsLocale });
				break;
			case "YMD":
				formatted = format(date, "yyyy-MM-dd", { locale: dateFnsLocale });
				break;
			case "relative":
				formatted = formatDistanceToNow(date, {
					addSuffix: true,
					locale: dateFnsLocale,
				});
				break;
			default:
				formatted = format(date, "MMM d, yyyy", { locale: dateFnsLocale });
		}

		// Add time if not hidden
		if (timeFormat !== "hidden" && dateFormat !== "relative") {
			const timeFormatString = timeFormat === "12hour" ? "h:mm a" : "HH:mm";
			formatted += ` ${format(date, timeFormatString, { locale: dateFnsLocale })}`;
		}

		return formatted;
	}, [date, dateFormat, timeFormat, dateFnsLocale]);

	// Early returns after all hooks
	if (!value) {
		return <span className="text-muted-foreground text-sm">-</span>;
	}

	if (!formattedDate) {
		return <span className="text-sm">{String(value)}</span>;
	}

	return <span className="whitespace-nowrap text-sm">{formattedDate}</span>;
}
