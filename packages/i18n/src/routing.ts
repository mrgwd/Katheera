// Shared locale routing constants — framework-agnostic (no next-intl
// imports here) so both the Next.js app (via next-intl) and the Vite
// extension (via use-intl) can consume them.

export const locales = ["en", "ar"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// Default locale is served without a prefix, others are prefixed
// (e.g. /ar/contribute).
export const localePrefix = "as-needed" as const;

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (locales as readonly string[]).includes(value)
  );
}

export function localeDir(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
