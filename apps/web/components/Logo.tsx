"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export default function Logo() {
  const t = useTranslations("marketing.common");
  return (
    <div>
      <Image src="/logo.png" alt={t("logoAlt")} width={25} height={25} />
    </div>
  );
}
