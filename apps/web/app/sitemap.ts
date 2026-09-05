import type { MetadataRoute } from "next";
import { SupportedAzkar } from "@workspace/azkar/constants";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages = ["/", "/privacy", "/contribute", "/app"].map(
    (path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
    }),
  );
  const zikrPages = SupportedAzkar.map((z) => ({
    url: `${SITE_URL}/app/zikr/${z.id}`,
    lastModified: now,
  }));
  return [...staticPages, ...zikrPages];
}
