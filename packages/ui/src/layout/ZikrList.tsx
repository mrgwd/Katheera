"use client";

import { cn } from "@workspace/lib/utils";
import { type Detections } from "@workspace/model/types";
import { buttonVariants } from "../components/button";

export default function ZikrList({
  list,
  LinkComponent = "a",
  href = "/zikr",
  to,
}: {
  list: Detections;
  LinkComponent?: React.ElementType;
  /** Next.js-style base path (Link `href`). */
  href?: string;
  /** TanStack Router-style base path (Link `to`). Takes precedence over `href`. */
  to?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(list)
        .filter(([_, zikr]) => zikr.render)
        .map(([id, zikr], index) => {
          // Next Link expects `href`, TanStack Link expects `to` — passing
          // the wrong prop silently breaks navigation.
          const linkProps =
            to !== undefined ? { to: `${to}/${id}` } : { href: `${href}/${id}` };
          return (
            <LinkComponent
              key={id}
              {...linkProps}
              className={cn(
                "animate-fade w-full cursor-pointer rounded-xl! font-bold opacity-0",
                buttonVariants({ variant: "secondary", size: "lg" }),
                zikr.count % 2 === 0 ? "shimmer-even" : "shimmer-odd",
              )}
              style={{ animationDelay: `${(index + 1) * 50}ms` }}
            >
              {zikr.label}
              <span>{zikr.count}</span>
            </LinkComponent>
          );
        })}
    </div>
  );
}
