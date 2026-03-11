"use client";

import { cn } from "@workspace/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { ArrowRight, ChevronRight } from "@workspace/ui/index";
import Link from "next/link";
import { useState } from "react";
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="mb-14 text-center">
        <p className="text-primary mb-3 text-xs font-semibold tracking-widest uppercase">
          FAQ
        </p>
        <h2 className="text-foreground text-4xl leading-tight font-black tracking-tight md:text-5xl">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <button
            key={index}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className={`w-full rounded-xl text-left transition-all ${
              openIndex === index
                ? "bg-muted/50 border-border border"
                : "bg-muted/50 hover:bg-muted border border-transparent"
            }`}
          >
            <div className="flex items-center justify-between p-6">
              <h3 className="text-foreground pr-4 font-semibold">
                {faq.question}
              </h3>
              <ChevronRight
                className={cn(
                  "transition",
                  openIndex === index ? "rotate-90" : "",
                )}
              />
            </div>

            {openIndex === index && (
              <div className="border-border/50 border-t px-6 pt-4 pb-6">
                <p className="text-foreground/70 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Contact */}
      <div className="bg-primary/5 border-primary/20 space-y-3 rounded-2xl border p-8 text-center">
        <p className="text-foreground font-semibold">Still have questions?</p>
        <p className="text-foreground/70">
          Feel free to open an issue on GitHub or reach out to the developer
          directly.
        </p>
        <Button className="px-8" render={<Link href="github">Contact</Link>} />
      </div>
    </section>
  );
}
