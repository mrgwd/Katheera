import { getTranslations } from "next-intl/server";

export default async function PromoVideo() {
  const t = await getTranslations("marketing.promo");
  return (
    <div className="animate-fade opacity-0" style={{ animationDelay: "300ms" }}>
      <div className="border-border aspect-video overflow-hidden rounded-xl border shadow-lg md:rounded-3xl md:shadow-2xl">
        <iframe
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/xTEgljBI_aE"
          title={t("title")}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
