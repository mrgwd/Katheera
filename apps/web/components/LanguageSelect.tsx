"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { isLocale, locales } from "@workspace/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

/**
 * Language picker for the web settings panel. Switches locale by replacing
 * the current pathname under the new locale (localePrefix: as-needed, so
 * English resolves back to unprefixed URLs).
 */
export function LanguageSelect() {
  const locale = useLocale();
  const t = useTranslations("locale");
  const router = useRouter();
  const pathname = usePathname();
  return (
    <Select
      value={locale}
      onValueChange={(value) => {
        if (value && isLocale(value)) router.replace(pathname, { locale: value });
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
