import { JSX } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isLocale } from "@workspace/i18n/routing";
import { getZikrData } from "@workspace/azkar/helpers";
import { ZikrInfo } from "@workspace/azkar/types";
import { ArrowRight } from "@workspace/ui/index";
import { Button } from "@workspace/ui/components/button";
import ZikrInfoList from "@workspace/ui/layout/ZikrInfoList";
import { Link } from "@/i18n/navigation";
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
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({
    locale: isLocale(locale) ? locale : "en",
    namespace: "app.zikr",
  });
  const zikr = SupportedAzkar.find((z) => z.id === slug);
  if (!zikr) return { title: t("notFound") };
  return {
    title: zikr.label,
    description: t("descTemplate", { label: zikr.label }),
  };
}

export default async function ZikrDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<JSX.Element> {
  const { slug } = await params;
  const t = await getTranslations("app.zikr");
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
          <ArrowRight className="rtl:scale-x-[-1]" />
          {t("back")}
        </Button>
      </Link>
      <ZikrInfoList zikrInfoList={data} LinkComponent={Link} />
    </div>
  );
}
