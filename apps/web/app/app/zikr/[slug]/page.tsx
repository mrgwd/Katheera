import { JSX } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getZikrData } from "@workspace/azkar/helpers";
import { ZikrInfo } from "@workspace/azkar/types";
import { ArrowRight } from "@workspace/ui/index";
import { Button } from "@workspace/ui/components/button";
import ZikrInfoList from "@workspace/ui/layout/ZikrInfoList";
import Link from "next/link";
import { SupportedAzkar } from "@workspace/azkar/constants";

export const dynamicParams = false;

export async function generateStaticParams() {
  return SupportedAzkar.map((z) => ({
    slug: z.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const zikr = SupportedAzkar.find((z) => z.id === slug);
  if (!zikr) return { title: "Not found" };
  return {
    title: zikr.label,
    description: `Learn about ${zikr.label} — meaning, sources, and repeated recitation with Katheera.`,
  };
}

export default async function ZikrDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<JSX.Element> {
  const { slug } = await params;
  let data: ZikrInfo[];
  try {
    data = await getZikrData(slug);
  } catch {
    notFound();
  }
  return (
    <div className="space-y-2">
      <Link href="/app">
        <Button variant="ghost" className="my-4">
          <ArrowRight />
          عودة
        </Button>
      </Link>
      <ZikrInfoList zikrInfoList={data} LinkComponent={Link} />
    </div>
  );
}
