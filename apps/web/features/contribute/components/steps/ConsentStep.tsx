"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@workspace/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { ArrowRight } from "@workspace/ui/index";

interface ConsentStepProps {
  onConsent: () => void;
}

const CONSENT_ITEMS = [
  {
    id: "upload",
    label:
      "I understand my voice recordings will be uploaded to a server and stored for AI model training purposes.",
  },
  {
    id: "anonymous",
    label:
      "I understand this is anonymous — no personal information is collected alongside my recordings, and I can stop at any time.",
  },
  {
    id: "policy",
    label: (
      <>
        I have read and agree to the{" "}
        <Link
          href="/privacy#contributors"
          target="_blank"
          className="text-foreground underline underline-offset-4"
        >
          Contributor Privacy Notice
        </Link>
        .
      </>
    ),
  },
] as const;

export function ConsentStep({ onConsent }: ConsentStepProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const allChecked = CONSENT_ITEMS.every((item) => checked[item.id]);

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="animate-fade space-y-8 opacity-0">
      <div className="space-y-2 text-center">
        <div className="mx-auto mb-4 text-4xl">🔒</div>
        <h2 className="text-foreground text-2xl font-bold">Before we start</h2>
        <p className="text-muted-foreground text-sm">
          Please confirm the following — all three are required.
        </p>
      </div>

      <div className="space-y-3">
        {CONSENT_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            aria-pressed={!!checked[item.id]}
            className={cn(
              "border-border hover:border-primary/50 flex w-full cursor-pointer items-start gap-4 rounded-xl border p-4 text-left transition-all duration-150",
              checked[item.id]
                ? "border-primary/40 bg-primary/5"
                : "bg-muted/30",
            )}
          >
            {/* Visual checkbox only — the outer button owns the toggle, so
                this is hidden from assistive tech (see F2). */}
            <Checkbox
              checked={!!checked[item.id]}
              onCheckedChange={() => toggle(item.id)}
              tabIndex={-1}
              aria-hidden
              className="pointer-events-none mt-0.5 size-5"
            />
            <p className="text-foreground text-sm leading-relaxed">
              {item.label}
            </p>
          </button>
        ))}
      </div>

      <Button
        size="lg"
        onClick={onConsent}
        disabled={!allChecked}
        className="w-full font-semibold hover:scale-[1.01] active:scale-[0.99]"
      >
        Start Recording <ArrowRight />
      </Button>

      <p className="text-muted-foreground text-center text-xs">
        You can stop at any point — any recordings already submitted still count
        and help the model.
      </p>
    </div>
  );
}
