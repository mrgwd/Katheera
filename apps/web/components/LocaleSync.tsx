"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_CHANGE_EVENT, isLocale } from "@workspace/i18n/routing";

/**
 * Reacts to user-initiated locale changes from the shared LanguageSelect
 * (settings panel) by navigating the current pathname under the new locale.
 * Mounted once in the locale layout. Event-driven (not settings-driven),
 * so async settings hydration can never trigger a spurious navigation.
 */
export function LocaleSync() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const handler = (e: Event) => {
      const next = (e as CustomEvent).detail;
      if (!isLocale(next) || next === locale) return;
      router.replace(pathname, { locale: next });
    };
    window.addEventListener(LOCALE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(LOCALE_CHANGE_EVENT, handler);
  }, [locale, pathname, router]);
  return null;
}
