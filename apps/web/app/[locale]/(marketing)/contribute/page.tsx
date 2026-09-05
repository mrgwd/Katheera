import type { Metadata } from "next";
import { ContributePage } from "@/features/contribute/components/ContributePage";

export const metadata: Metadata = {
  title: "Contribute — Katheera",
  description:
    "Help Katheera recognize more voices. Donate a few voice samples to train the AI model and earn ongoing rewards (sadaqah jariyah).",
};

export default function ContributePageRoute() {
  return <ContributePage />;
}
