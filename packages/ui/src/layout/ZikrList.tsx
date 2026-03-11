"use client";

import { cn } from "@workspace/lib/utils";
import { type Detections } from "@workspace/model/types";
import ZikrCard from "./ZikrCard";

export default function ZikrList({
  list,
  LinkComponent = "a",
  href = "/zikr",
}: {
  list: Detections;
  LinkComponent?: React.ElementType;
  href?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(list)
        .filter(([_, zikr]) => zikr.render)
        .map(([id, zikr]) => {
          return (
            <LinkComponent key={id} href={href + "/" + id}>
              <ZikrCard
                className={cn(
                  zikr.count % 2 === 0 ? "shimmer-even" : "shimmer-odd",
                )}
              >
                <ZikrCard.Header>{zikr.label}</ZikrCard.Header>
                <ZikrCard.Count>{zikr.count}</ZikrCard.Count>
              </ZikrCard>
            </LinkComponent>
          );
        })}
    </div>
  );
}
