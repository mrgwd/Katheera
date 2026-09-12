"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LocaleNavigationProvider } from "@workspace/ui/components/language-select";
import type { Locale } from "@workspace/i18n/routing";

/**
 * Connects the shared LanguageSelect (inside SettingsPanel) to Next.js routing.
 * When the user picks a language in the web app, this navigates the current
 * pathname under the new locale.
 */
export function WebLocaleProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = (nextLocale: Locale) => {
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <LocaleNavigationProvider onNavigate={handleNavigate}>
      {children}
    </LocaleNavigationProvider>
  );
}
