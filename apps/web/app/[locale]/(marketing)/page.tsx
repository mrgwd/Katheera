import { setRequestLocale } from "next-intl/server";
import { isLocale } from "@workspace/i18n/routing";
import { FAQ } from "@/components/FAQs";
import HeroSection from "@/components/HeroSection";
import KeyFeatures from "@/components/KeyFeatures";
import PromoVideo from "@/components/PromoVideo";

export default async function MarketingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // See (marketing)/layout.tsx — re-asserted per segment for static rendering.
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  return (
    <main className="layout space-y-16 md:space-y-24">
      <div className="space-y-8 md:space-y-24">
        <HeroSection />
        <PromoVideo />
      </div>
      <KeyFeatures />
      <FAQ />
    </main>
  );
}
