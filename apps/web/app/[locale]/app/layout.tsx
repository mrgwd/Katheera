import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { isLocale } from "@workspace/i18n/routing";
import { vazirmatn } from "@/lib/fonts";
import { version } from "../../../package.json";
import { DynamicMetadata } from "@/features/zikr-app/components/DynamicMetadata";
import { AppBootstrapper } from "@/features/zikr-app/components/AppBootstrapper";
import { Providers } from "@/features/zikr-app/providers/Providers";
import { FloatingMiniBarWrapper } from "@/features/zikr-app/components/FloatingMiniBarWrapper";
import { DevAudioDebugger } from "@workspace/ui/components/DevAudioDebugger";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: isLocale(locale) ? locale : "en",
    namespace: "app.meta",
  });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main
      lang="ar"
      dir="rtl"
      className={`${vazirmatn.variable} mx-auto max-w-xs p-2 font-sans antialiased`}
    >
      <Providers>
        <AppBootstrapper />
        <DynamicMetadata />
        {children}
        {process.env.NODE_ENV === "development" && (
          <DevAudioDebugger apiKey={process.env.EDGE_IMPULSE_API_KEY} />
        )}
        <FloatingMiniBarWrapper />
        <p className="text-muted-foreground absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-xs">
          v{version}
        </p>
      </Providers>
    </main>
  );
}
