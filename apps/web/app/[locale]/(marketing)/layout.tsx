import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale } from "@workspace/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: isLocale(locale) ? locale : "en",
    namespace: "meta",
  });
  return {
    // Title falls back to the root default; description is localized.
    description: t("description"),
  };
}

export default async function MarketingLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  // Per-segment setRequestLocale: the root locale layout's call does not
  // reliably reach this subtree during prerender (see commit history) —
  // re-asserting here keeps translated Server Components static.
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
