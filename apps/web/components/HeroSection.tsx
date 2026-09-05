import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import HeroSectionCTA from "./HeroSectionCTA";

export default async function HeroSection() {
  const t = await getTranslations("marketing.hero");
  const tCommon = await getTranslations("marketing.common");
  return (
    <section className="space-y-6 pt-20">
      <div className="animate-fade flex items-center justify-center gap-2 opacity-0">
        <Image src="/logo.png" alt={tCommon("logoAlt")} width={25} height={25} />
        <p className="text-lg font-bold md:text-xl lg:text-2xl">Katheera</p>
      </div>
      <h1
        className="animate-fade text-center text-3xl font-bold text-balance opacity-0 sm:text-4xl md:text-5xl lg:text-7xl"
        style={{ animationDelay: "50ms" }}
      >
        {t.rich("title", {
          muted: (chunks: ReactNode) => (
            <span className="text-muted-foreground/50">{chunks}</span>
          ),
          brand: (chunks: ReactNode) => (
            <span className="text-brand">{chunks}</span>
          ),
        })}
      </h1>
      <p
        className="animate-fade mx-auto max-w-xs text-center text-neutral-400 opacity-0"
        style={{ animationDelay: "100ms" }}
      >
        <q className="">
          <i>{t("quote")}</i>
        </q>
        <br />
        {t("cite")}
      </p>
      <div className="flex flex-col items-center justify-center gap-2">
        <div
          className="animate-fade flex gap-2 opacity-0"
          style={{ animationDelay: "150ms" }}
        >
          <HeroSectionCTA />
        </div>
        <small
          className="animate-fade text-neutral-400 opacity-0"
          style={{ animationDelay: "200ms" }}
        >
          {t("badges")}
        </small>
      </div>
    </section>
  );
}
