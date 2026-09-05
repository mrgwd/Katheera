import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { isLocale, localeDir, type Locale } from "@workspace/i18n/routing";
import { SITE_URL } from "@/lib/site";
import "../../globals.css";
import { vazirmatn } from "@/lib/fonts";
import { ThemeProvider as NextThemesProvider } from "@workspace/ui/components/theme-provider";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("title"),
      template: "%s | Katheera",
    },
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  // Static rendering per locale (pages below inherit the locale).
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} dir={localeDir(locale)} suppressHydrationWarning>
      <body className={`${vazirmatn.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            {children}
          </NextThemesProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
