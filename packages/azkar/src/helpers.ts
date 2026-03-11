import { SupportedAzkar } from "./constants";

export const buildInitialDetections = () => {
  const base: Record<
    string,
    { count: number; lastAccuracy: number; label: string; href?: string; render: boolean }
  > = {};

  SupportedAzkar.forEach((z) => {
    base[z.id] = {
      count: z.count ?? 0,
      lastAccuracy: z.lastAccuracy ?? 0,
      label: z.label,
      href: z.href,
      render: z.render ?? true,
    };
  });

  base["noise"] = { count: 0, lastAccuracy: 0, label: "noise", render: false };
  base["unknown"] = { count: 0, lastAccuracy: 0, label: "unknown", render: false };

  return base;
};

export async function getZikrData(
  slug: string,
): Promise<import("./types").ZikrInfo[]> {
  try {
    const module = await import(`./data/${slug}.json`);
    return module.default;
  } catch (error) {
    console.error(`Failed to load zikr data for slug: ${slug}`, error);
    throw new Error(`Zikr data not found for: ${slug}`);
  }
}
