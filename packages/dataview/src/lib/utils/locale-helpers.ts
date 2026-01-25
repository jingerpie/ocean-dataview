/**
 * Gets the user's preferred locale for formatting dates and numbers
 * Prioritizes HTML lang attribute, falls back to browser locale
 * @returns Locale string (e.g., "zh-CN", "en-US", "de-DE")
 */
export function getUserLocale(): string {
  // In browser environment, check HTML lang attribute first
  if (typeof document !== "undefined") {
    const htmlLang = document.documentElement.lang;
    if (htmlLang) {
      return htmlLang;
    }
  }

  // Fallback to browser locale
  // if (typeof navigator !== "undefined") {
  // 	return navigator.language;
  // }

  // Final fallback for SSR or other environments
  return "en-US";
}
