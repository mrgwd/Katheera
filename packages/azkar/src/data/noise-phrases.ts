/**
 * packages/azkar/src/data/noise-phrases.ts
 *
 * Arabic phrases used for the "unknown/noise" class in the contribution flow.
 * These should be common, daily-used MSA phrases — nothing religious or overlapping
 * phonetically with the zikr classes.
 *
 * DATA SHAPE:
 *   - phrases: everyday MSA sentences (you will populate these)
 *   - openPrompts: open-ended topic-bounded instructions (one-in-four ratio in UI)
 *
 * NOTE: You (the maintainer) should populate the `phrases` array with
 * 100–300 Arabic sentences before deploying. Keep sentences short (4–10 words),
 * common vocabulary, no religious content.
 */

export interface NoisePhrase {
  /** The Arabic text to display to the contributor */
  text: string;
  /** Optional English hint for what the phrase means (for maintainer reference) */
  hint?: string;
}

export interface OpenPrompt {
  /** Instruction shown to the contributor */
  instruction: string;
}

/** MSA phrases bank — populate before deploying */
export const noisePhrases: NoisePhrase[] = [
  // PLACEHOLDER — replace with your curated phrases
  { text: "كيف حالك اليوم؟", hint: "How are you today?" },
  { text: "ما اسمك؟", hint: "What is your name?" },
  { text: "أين تسكن؟", hint: "Where do you live?" },
  { text: "الطقس جميل اليوم.", hint: "The weather is nice today." },
  { text: "أحب القهوة في الصباح.", hint: "I like coffee in the morning." },
  { text: "هذا الكتاب ممتاز.", hint: "This book is excellent." },
  { text: "ماذا تفعل في وقت فراغك؟", hint: "What do you do in your free time?" },
  { text: "أريد كوباً من الماء.", hint: "I want a glass of water." },
];

/** Open-ended prompts that produce natural, unscripted speech */
export const openPrompts: OpenPrompt[] = [
  { instruction: "Talk about what you had for breakfast today (in Arabic)" },
  { instruction: "Count from one to ten in Arabic" },
  { instruction: "Describe the room you're in right now (in Arabic)" },
  { instruction: "Say your favorite Arabic word and what it means" },
];
