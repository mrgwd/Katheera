import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { isLocale } from "@workspace/i18n/routing";
import en from "@workspace/i18n/messages/en";
import ar from "@workspace/i18n/messages/ar";

const catalogs = { en, ar } as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested) ? requested : routing.defaultLocale;
  return {
    locale,
    messages: catalogs[locale],
  };
});
