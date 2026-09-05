// English message catalog — the shape authority. ar.ts must satisfy the
// `Messages` type below, so missing/extra keys fail at compile time.
// (Values are widened strings: only the key structure is enforced.)

const en = {
  meta: {
    title: "Katheera - Smart Sebha",
    description:
      "A smart sebha that uses AI to count your zikr for you while you are working, studying, or focusing on something else.",
  },
  locale: {
    en: "English",
    ar: "العربية",
  },
};

export type Messages = typeof en;

export default en;
