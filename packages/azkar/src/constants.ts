import type { Zikr } from "./types";

export const AzkarList: Zikr[] = [
  {
    id: "sbhn",
    label: "سبحان الله",
    href: "subhanallah",
    count: 0,
    lastAccuracy: 0,
    render: true,
  },
  {
    id: "hamd",
    label: "الحمد لله",
    href: "alhamdulillah",
    count: 0,
    lastAccuracy: 0,
    render: true,
  },
  {
    id: "akbr",
    label: "الله أكبر",
    href: "allahuakbar",
    count: 0,
    lastAccuracy: 0,
    render: true,
  },
  {
    id: "noise",
    label: "noise",
    href: "noise",
    count: 0,
    lastAccuracy: 0,
    render: false,
  },
  {
    id: "unknown",
    label: "unknown",
    href: "unknown",
    count: 0,
    lastAccuracy: 0,
    render: false,
  },
];
export const SupportedAzkar = AzkarList.filter((z) => z.render);
export const getAzkarKeys = (): string[] => SupportedAzkar.map((z) => z.id);

/** Tone variation instructions cycled per zikr sample in the contribution flow */
export const TONE_VARIATIONS = [
  { id: "normal", label: "Naturally", emoji: "🗣️", instruction: "Say it in your natural voice" },
  { id: "quiet", label: "Quietly", emoji: "🔇", instruction: "Say it softly, almost a whisper" },
  { id: "fast", label: "Quickly", emoji: "⚡", instruction: "Say it a bit faster than usual" },
  { id: "slow", label: "Slowly", emoji: "🐢", instruction: "Say it slowly and clearly" },
  { id: "deep", label: "Deeply", emoji: "🎙️", instruction: "Say it with a deeper voice" },
  { id: "far", label: "From a distance", emoji: "📡", instruction: "Hold the mic further away as you speak" },
] as const;

export type ToneVariationId = (typeof TONE_VARIATIONS)[number]["id"];

/**
 * Azkar prompts used in the contribution recording flow.
 * 6 samples per zikr, each with a different tone variation.
 */
export const ContributeAzkar = SupportedAzkar.map((zikr) => ({
  ...zikr,
  samples: TONE_VARIATIONS.map((tone, i) => ({
    sampleIndex: i,
    toneVariation: tone,
  })),
}));

/**
 * Version string for the audio processing pipeline.
 * Bump this whenever resampleAudio / normalizeAudio parameters change.
 * All accepted samples are tagged with this version for future re-processing.
 */
export const PIPELINE_VERSION = "v1.0";
