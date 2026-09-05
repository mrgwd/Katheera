import { useEffect } from "react";
import type { ReactNode } from "react";
import { IntlProvider } from "use-intl";
import { useSettings } from "@workspace/ui/hooks/useSettings";
import { localeDir, type Locale } from "@workspace/i18n/routing";
import type { Messages } from "@workspace/i18n/messages/en";
import en from "@workspace/i18n/messages/en";
import ar from "@workspace/i18n/messages/ar";

declare module "use-intl" {
  interface AppConfig {
    Messages: Messages;
    Locale: Locale;
  }
}

const catalogs = { en, ar } as const;

/**
 * Provides translated messages to the popup, driven by the persisted
 * `language` setting (hash history has no URL locale to read). Must render
 * inside <SettingsProvider>. Also keeps <html> lang/dir in sync.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const locale = settings.language;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDir(locale);
  }, [locale]);

  return (
    <IntlProvider locale={locale} messages={catalogs[locale]}>
      {children}
    </IntlProvider>
  );
}
