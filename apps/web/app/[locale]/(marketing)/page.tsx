import { FAQ } from "@/components/FAQs";
import HeroSection from "@/components/HeroSection";
import KeyFeatures from "@/components/KeyFeatures";
import PromoVideo from "@/components/PromoVideo";

export default function MarketingPage() {
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
