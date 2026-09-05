import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale } from "@workspace/i18n/routing";
import { ContributePage } from "@/features/contribute/components/ContributePage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: isLocale(locale) ? locale : "en",
    namespace: "contribute.meta",
  });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ContributePageRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // See (marketing)/layout.tsx — re-asserted per segment for static rendering.
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  return <ContributePage />;
}
