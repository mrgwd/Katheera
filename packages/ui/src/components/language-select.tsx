"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useLocale, useTranslations } from "use-intl";
import { useSettings } from "../hooks/useSettings";
import { isLocale, locales, type Locale } from "@workspace/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

type LocaleNavigationHandler = (locale: Locale) => void;

const LocaleNavigationContext = createContext<LocaleNavigationHandler | null>(
  null,
);

/**
 * Optional provider for hosts (like Next.js web) that require URL route
 * transitions on locale changes. Hosts without URL locales (like the extension)
 * omit this provider; the select then just updates persisted settings.
 */
export function LocaleNavigationProvider({
  onNavigate,
  children,
}: {
  onNavigate: LocaleNavigationHandler;
  children: ReactNode;
}) {
  return (
    <LocaleNavigationContext.Provider value={onNavigate}>
      {children}
    </LocaleNavigationContext.Provider>
  );
}

export function useLocaleNavigation() {
  return useContext(LocaleNavigationContext);
}

/**
 * Shared language picker (rendered inside SettingsPanel on both hosts).
 *
 * Display comes from the provider locale; a change persists via settings
 * (which the extension reacts to) and notifies the host navigator if
 * provided (which the web Next.js router reacts to).
 * Zero prop drilling through TopBar/SettingsPanel.
 */
export function LanguageSelect() {
  const locale = useLocale();
  const t = useTranslations("locale");
  const { updateSetting } = useSettings();
  const onNavigate = useLocaleNavigation();

  return (
    <Select
      value={locale}
      onValueChange={(value) => {
        if (!value || !isLocale(value) || value === locale) return;
        updateSetting("language", value);
        onNavigate?.(value);
      }}
    >
      <SelectTrigger size="sm">
        <SelectValue>
          {(value: unknown) =>
            isLocale(value)
              ? t(value)
              : isLocale(locale)
                ? t(locale)
                : ""
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        side="bottom"
        align="start"
        alignItemWithTrigger={false}
      >
        {locales.map((code) => (
          <SelectItem key={code} value={code}>
            {t(code)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
