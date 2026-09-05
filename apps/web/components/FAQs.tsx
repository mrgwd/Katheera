"use client";

import { cn } from "@workspace/lib/utils";
import { buttonVariants } from "@workspace/ui/components/button-variants";
import { GITHUB_REPO_URL } from "@/lib/site";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { Messages } from "@workspace/i18n/messages/en";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";

type FaqItem = Messages["marketing"]["faq"]["items"][number];

export function FAQ() {
  const t = useTranslations("marketing.faq");
  const faqs = t.raw("items") as FaqItem[];
  return (
    <section id="faq" className="space-y-6">
      <div className="mb-14 text-center">
        <p className="text-primary mb-3 text-xs font-semibold tracking-widest uppercase">
          {t("eyebrow")}
        </p>
        <h2 className="text-foreground text-4xl leading-tight font-black tracking-tight md:text-5xl">
          {t("title")}
        </h2>
      </div>

      <Accordion className="space-y-4">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="bg-muted/50 border-border/50 data-open:border-border/100 rounded-2xl border transition-all"
          >
            <AccordionTrigger className="text-foreground px-6 py-5 text-base font-semibold select-none hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-foreground/70 px-6 pb-6 text-sm leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="bg-primary/5 border-primary/20 space-y-3 rounded-2xl border p-8 text-center">
        <p className="text-foreground font-semibold">{t("stillTitle")}</p>
        <p className="text-foreground/70">{t("stillBody")}</p>
        <Link
          href={GITHUB_REPO_URL}
          className={cn("px-8", buttonVariants({ variant: "default" }))}
        >
          {t("contact")}
        </Link>
      </div>
    </section>
  );
}
