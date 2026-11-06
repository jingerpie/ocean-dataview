/**
 * Gets the user's preferred locale for formatting dates and numbers
 * Prioritizes HTML lang attribute, falls back to browser locale
 * @returns Locale string (e.g., "zh-CN", "en-US", "de-DE")
 */
export function getUserLocale(): string {
  if (typeof document !== "undefined") {
    const htmlLang = document.documentElement.lang;
    if (htmlLang) {
      return htmlLang;
    }
  }

  return "en-US";
}
