import type { MetadataRoute } from "next";
import { SupportedAzkar } from "@workspace/azkar/constants";
import { SITE_URL } from "@/lib/site";
import { locales, type Locale } from "@workspace/i18n/routing";

const STATIC_PATHS = ["/", "/privacy", "/contribute", "/app"];

function prefixed(path: string, locale: Locale): string {
  // Default locale is served without a prefix (localePrefix: 'as-needed').
  return locale === "en" ? `${SITE_URL}${path}` : `${SITE_URL}/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = [
    ...STATIC_PATHS,
    ...SupportedAzkar.map((z) => `/app/zikr/${z.id}`),
  ];
  return locales.flatMap((locale) =>
    paths.map((path) => ({
      url: prefixed(path, locale),
      lastModified: now,
    })),
  );
}
