import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale } from "@workspace/i18n/routing";

// Sections are heterogeneous (some carry a list and/or note, others don't),
// so the raw payload is read through this normalized shape instead of the
// exact per-index catalog type.
interface PrivacySection {
  title: string;
  content?: string;
  listLabel?: string;
  list?: string[];
  note?: string;
}

export default async function Privacy({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // See (marketing)/layout.tsx — re-asserted per segment for static rendering.
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations("marketing.privacy");
  const sections = t.raw("sections") as PrivacySection[];
  const collectedItems = t.raw("collectedItems") as string[];
  const notCollectedItems = t.raw("notCollectedItems") as string[];
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* <Navbar /> */}

      <main className="layout pt-32 pb-24">
        {/* Header */}
        <div
          className="animate-fade mb-12 opacity-0"
          style={{ animationDelay: "100ms" }}
        >
          <p className="text-muted-foreground mb-3 text-sm">
            {t("lastUpdated")}
          </p>
          <h1 className="text-foreground mb-4 text-4xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {t("introA")}{" "}
            <span className="text-foreground font-medium">{t("introB")}</span>{" "}
            {t("introC")}
          </p>
        </div>

        {/* Divider */}
        <div
          className="border-border animate-fade mb-12 border-t opacity-0"
          style={{ animationDelay: "200ms" }}
        />

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section, i) => (
            <div
              key={i}
              className="animate-fade opacity-0"
              style={{ animationDelay: `${i * 100 + 100}ms` }}
            >
              <h2 className="text-foreground mb-3 text-lg font-semibold">
                {section.title}
              </h2>
              <p className="text-muted-foreground mb-3 leading-relaxed">
                {section.content}
              </p>

              {section.listLabel && (
                <p className="text-muted-foreground mb-2 text-sm">
                  {section.listLabel}
                </p>
              )}

              {section.list && (
                <ul className="mb-3 space-y-2">
                  {section.list.map((item, j) => (
                    <li
                      key={j}
                      className="text-muted-foreground flex items-start gap-2 text-sm"
                    >
                      <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {section.note && (
                <p className="text-muted-foreground/80 border-primary/30 border-s-2 ps-4 text-sm leading-relaxed italic">
                  {section.note}
                </p>
              )}
            </div>
          ))}

          {/* Contact */}
          <div>
            <h2 className="text-foreground mb-3 text-lg font-semibold">
              {t("contactTitle")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("contactBodyA")}{" "}
              <a
                href="mailto:hi@mohamedramadan.dev"
                className="text-primary underline-offset-4 transition-colors hover:underline"
              >
                hi@mohamedramadan.dev
              </a>
            </p>
          </div>

          {/* Contributors section */}
          <div
            id="contributors"
            className="border-border scroll-mt-20 rounded-xl border p-6"
          >
            <div className="mb-4 flex items-start gap-3">
              <span className="mt-0.5 text-xl">🎙️</span>
              <div>
                <h2 className="text-foreground mb-1 text-lg font-semibold">
                  {t("contribTitle")}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("contribIntroA")}{" "}
                  <Link
                    href="/contribute"
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    {t("contribLink")}
                  </Link>{" "}
                  {t("contribIntroB")}
                </p>
              </div>
            </div>

            <div className="border-border mb-4 rounded-lg border bg-amber-50/60 p-4 dark:bg-amber-900/10">
              <p className="text-foreground text-sm font-medium">
                ⚠️ {t("contribWarn")}
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-foreground mb-1 font-medium">
                  {t("collectedTitle")}
                </p>
                <ul className="text-muted-foreground space-y-1">
                  {collectedItems.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-foreground mb-1 font-medium">
                  {t("notCollectedTitle")}
                </p>
                <ul className="text-muted-foreground space-y-1">
                  {notCollectedItems.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-foreground mb-1 font-medium">
                  {t("storageTitle")}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {t("storageBody")}
                </p>
              </div>

              <div>
                <p className="text-foreground mb-1 font-medium">
                  {t("withdrawTitle")}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {t("withdrawBodyA")}{" "}
                  <a
                    href="mailto:hi@mohamedramadan.dev"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    hi@mohamedramadan.dev
                  </a>{" "}
                  {t("withdrawBodyB")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* <FooterSection /> */}
    </div>
  );
}
