"use client";

import { cn } from "@workspace/lib/utils";
import { buttonVariants } from "@workspace/ui/components/button";
import { GITHUB_REPO_URL } from "@/lib/site";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";

const faqs = [
  {
    question: "Does Katheera record my voice?",
    answer:
      "No. Katheera processes all audio on your device using on-device AI. Your voice is never recorded, stored, or sent to external servers. Everything stays private and on your computer.",
  },
  {
    question: "Does it work offline?",
    answer:
      "Yes! Katheera works completely offline. The AI model runs locally on your device, so you can count your zikr even without an internet connection.",
  },
  {
    question: "What phrases are supported?",
    answer:
      "Currently, Katheera supports: Subhan'Allah (سبحان الله), Al-Hamdulillah (الحمد لله). We're continuously improving phrase recognition based on user feedback.",
  },
  {
    question: "How accurate is the detection?",
    answer:
      "Katheera uses on-device AI for phrase detection. Accuracy improves over time as the model learns.",
  },
  {
    question: "Is Katheera free?",
    answer:
      "Yes! Katheera is completely free to use. It's an open-source project built by the community for the community.",
  },
  {
    question: "Can I sync my count across devices?",
    answer:
      "Currently, your count is stored locally in the extension. We might explore optional cloud sync features in the future for users who want to track their zikr across multiple devices.",
  },
  {
    question: "Does it work in all languages?",
    answer:
      "Katheera currently focuses on Arabic zikr phrases. English transliterations are supported for better learning and accessibility.",
  },
  {
    question: "What if it misdetects my speech?",
    answer:
      "If you experience accuracy issues, you can adjust microphone sensitivity settings. You can also provide feedback to help improve the model.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="space-y-6">
      <div className="mb-14 text-center">
        <p className="text-primary mb-3 text-xs font-semibold tracking-widest uppercase">
          FAQ
        </p>
        <h2 className="text-foreground text-4xl leading-tight font-black tracking-tight md:text-5xl">
          Frequently Asked Questions
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
        <p className="text-foreground font-semibold">Still have questions?</p>
        <p className="text-foreground/70">
          Feel free to open an issue on GitHub or reach out to the developer
          directly.
        </p>
        <Link
          href={GITHUB_REPO_URL}
          className={cn("px-8", buttonVariants({ variant: "default" }))}
        >
          Contact
        </Link>
      </div>
    </section>
  );
}
