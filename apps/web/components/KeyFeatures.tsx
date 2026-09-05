import {
  Hand,
  WifiOff,
  Lock,
  Zap,
  LayoutGrid,
  Heart,
} from "@workspace/ui/index";
import { getTranslations } from "next-intl/server";
import type { Messages } from "@workspace/i18n/messages/en";

type FeatureItem = Messages["marketing"]["features"]["items"][number];

const icons = [Hand, WifiOff, Lock, Zap, LayoutGrid, Heart];

const KeyFeatures = async () => {
  const t = await getTranslations("marketing.features");
  const items = t.raw("items") as FeatureItem[];
  return (
    <section id="features" className="bg-background py-24">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="text-primary mb-3 text-xs font-semibold tracking-widest uppercase">
            {t("eyebrow")}
          </p>
          <h2 className="text-foreground text-4xl leading-tight font-black tracking-tight text-balance md:text-5xl">
            {t.rich("title", {
              grad: (chunks: React.ReactNode) => (
                <span className="text-gradient">{chunks}</span>
              ),
            })}
          </h2>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((feature, i) => {
            const Icon = icons[i] ?? Hand;
            return (
              <div
                key={feature.title}
                className="bg-muted/50 hover:bg-accent/40 group rounded-2xl p-6 transition-all duration-200"
              >
                <div className="bg-primary/5 group-hover:bg-primary/15 mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-colors">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="text-foreground mb-1.5 text-base font-semibold">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default KeyFeatures;
