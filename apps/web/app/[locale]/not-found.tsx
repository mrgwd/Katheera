import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("errors.notFound");
  return (
    <main className="layout space-y-4 py-32 text-center">
      <p className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
        404
      </p>
      <h1 className="text-foreground text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground text-sm">{t("body")}</p>
      <Link href="/" className="text-primary font-medium underline">
        {t("home")}
      </Link>
    </main>
  );
}
