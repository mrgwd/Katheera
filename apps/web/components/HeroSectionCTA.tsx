"use client";

import { cn } from "@workspace/lib/utils";
import { buttonVariants } from "@workspace/ui/components/button";
import { Chrome } from "@workspace/ui/index";
import Link from "next/link";

export default function HeroSectionCTA() {
  return (
    <div className="flex gap-2">
      <Link
        href="#"
        className={cn(
          "rounded-full! px-6!",
          buttonVariants({ variant: "default", size: "lg" }),
        )}
      >
        <Chrome /> Get the extension
      </Link>

      <Link
        href="/app"
        className={cn(
          "rounded-full! px-6!",
          buttonVariants({ variant: "secondary", size: "lg" }),
        )}
      >
        Try it now
      </Link>
    </div>
  );
}
