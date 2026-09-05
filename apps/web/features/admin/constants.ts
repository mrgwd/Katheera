export const LABELS = ["sbhn", "hamd", "akbr", "noise", "unknown"] as const;

export const LABEL_ARABIC: Record<string, string> = {
  sbhn: "سبحان الله",
  hamd: "الحمد لله",
  akbr: "الله أكبر",
  noise: "noise",
  unknown: "unknown",
};

export const ZIKR_LABELS = new Set(["sbhn", "hamd", "akbr"]);

export const PAGE_SIZE = 20;
