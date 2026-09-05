"use client";
import Logo from "./Logo";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { locales } from "@workspace/i18n/routing";
import { cn } from "@workspace/lib/utils";
import { CONTACT_EMAIL } from "@/lib/site";
import { buttonVariants } from "@workspace/ui/components/button-variants";

// next-intl's usePathname may include the locale prefix — strip it so the
// active-link compare works in every locale.
const localePrefixPattern = new RegExp(`^/(${locales.join("|")})(?=/|$)`);
function unprefixed(pathname: string): string {
  return pathname.replace(localePrefixPattern, "") || "/";
}

export default function Header() {
  const t = useTranslations("marketing.header");
  const pathname = usePathname();
  const active = unprefixed(pathname);
  const links = [
    { href: "/", label: t("home") },
    { href: "/privacy", label: t("privacy") },
    { href: "/contribute", label: t("contribute") },
  ];
  return (
    <header>
      <nav className="layout flex items-center justify-between pt-12 pb-4">
        <Logo />
        <ul className="flex gap-2 sm:gap-4">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "font-medium",
                  active === link.href ? "text-primary" : "text-neutral-400",
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={`mailto:${CONTACT_EMAIL}`}
          className={cn("underline", buttonVariants({ variant: "link" }))}
        >
          {t("contact")}
        </Link>
      </nav>
    </header>
  );
}
