import { Vazirmatn } from "next/font/google";

// Single shared font definition: Arabic subset is required — without it,
// zikr phrases (سبحان الله, …) silently fall back to system fonts.
export const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
});
