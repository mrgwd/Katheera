import { useTranslations } from "use-intl";
import { useSettings } from "@workspace/ui/hooks/useSettings";
import { isLocale, locales } from "@workspace/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

/**
 * Language picker for the extension popup. Rendered as a slot inside the
 * shared SettingsPanel (web passes nothing — its locale comes from the URL).
 */
export function LanguageSelect() {
  const { settings, updateSetting } = useSettings();
  const t = useTranslations("locale");
  return (
    <Select
      value={settings.language}
      onValueChange={(value) => {
        if (value && isLocale(value)) updateSetting("language", value);
      }}
    >
      <SelectTrigger size="sm">
        <SelectValue />
      </SelectTrigger>
      {/* Edge-aligned (not selected-item-aligned): the popup viewport is
          ~240px wide and selected-item alignment math misbehaves there. */}
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
