// import { Github } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { GITHUB_ISSUES_URL, GITHUB_REPO_URL } from "@/lib/site";

export default async function Footer() {
  const t = await getTranslations("marketing.footer");
  const tCommon = await getTranslations("marketing.common");
  return (
    <footer className="bg-muted/40 border-border mt-16 border-t md:mt-24">
      <div className="layout py-14 max-sm:px-2">
        {/* Top grid */}
        <div className="mb-12 grid grid-cols-2 flex-wrap gap-12 md:flex md:justify-between">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <Image src="/logo.png" alt={tCommon("logoAlt")} width={16} height={16} />
              <p className="text-sm font-bold">Katheera</p>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed md:max-w-40">
              {t("tagline")}
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-foreground mb-4 text-sm font-semibold">
              {t("product")}
            </p>
            <ul className="">
              {[
                {
                  label: t("chromeStore"),
                  href: "https://chrome.google.com/webstore",
                  external: true,
                },
                {
                  label: t("howItWorks"),
                  href: "/#features",
                  external: false,
                },
                { label: t("faq"), href: "/#faq", external: false },
              ].map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <p className="text-foreground mb-4 text-sm font-semibold">
              {t("community")}
            </p>
            <ul className="">
              {[
                { label: t("github"), href: GITHUB_REPO_URL, external: true },
                {
                  label: t("reportIssue"),
                  href: GITHUB_ISSUES_URL,
                  external: true,
                },
                {
                  label: t("contribute"),
                  href: "/contribute",
                  external: false,
                },
              ].map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-foreground mb-4 text-sm font-semibold">
              {t("legal")}
            </p>
            <ul className="">
              {[{ label: t("privacyPolicy"), href: "/privacy" }].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
