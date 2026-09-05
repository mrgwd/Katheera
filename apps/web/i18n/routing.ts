import { defineRouting } from "next-intl/routing";
import {
  defaultLocale,
  localePrefix,
  locales,
} from "@workspace/i18n/routing";

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix,
});
