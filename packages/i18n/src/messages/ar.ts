import type { Messages } from "./en";

// Arabic message catalog. Must satisfy the `Messages` shape from en.ts —
// the compiler rejects missing, extra, or mistyped keys.
const ar: Messages = {
  meta: {
    title: "كثيرة — سبحة ذكية",
    description:
      "سبحة ذكية تستخدم الذكاء الاصطناعي لعدّ أذكارك أثناء العمل أو الدراسة أو التركيز على مهامك.",
  },
  locale: {
    en: "English",
    ar: "العربية",
  },
};

export default ar;
