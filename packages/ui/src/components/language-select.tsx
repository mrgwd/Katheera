"use client";

import { useLocale, useTranslations } from "use-intl";
import { useSettings } from "../hooks/useSettings";
import {
  LOCALE_CHANGE_EVENT,
  isLocale,
  locales,
} from "@workspace/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

/**
 * Shared language picker (rendered inside SettingsPanel on both hosts).
 *
 * Display comes from the provider locale; a change persists via settings
 * (this is what the extension reacts to) and dispatches a window event
 * (this is what the web reacts to — see web LocaleSync). Neither host
 * passes props, so there is no drilling in either direction.
 */
export function LanguageSelect() {
  const locale = useLocale();
  const t = useTranslations("locale");
  const { updateSetting } = useSettings();
  return (
    <Select
      value={locale}
      onValueChange={(value) => {
        if (!value || !isLocale(value) || value === locale) return;
        updateSetting("language", value);
        window.dispatchEvent(
          new CustomEvent(LOCALE_CHANGE_EVENT, { detail: value }),
        );
      }}
    >
      <SelectTrigger size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((code) => (
          <SelectItem key={code} value={code}>
            {t(code)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
