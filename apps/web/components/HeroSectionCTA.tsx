import { cn } from "@workspace/lib/utils";
import { buttonVariants } from "@workspace/ui/components/button-variants";
import { Chrome } from "@workspace/ui/index";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function HeroSectionCTA() {
  const t = await getTranslations("marketing.hero");
  return (
    <div className="flex gap-2">
      <a
        href="https://chromewebstore.google.com/detail/hajkcolmlblliodncplnekfjaonccifl"
        className={cn(
          "rounded-full! px-6!",
          buttonVariants({ variant: "default", size: "lg" }),
        )}
      >
        <Chrome /> {t("ctaPrimary")}
      </a>

      <Link
        href="/app"
        className={cn(
          "rounded-full! px-6!",
          buttonVariants({ variant: "secondary", size: "lg" }),
        )}
      >
        {t("ctaSecondary")}
      </Link>
    </div>
  );
}
