"use client";

import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import type { StatusFilter } from "../types";

interface AdminHeaderProps {
  total: number;
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
}

const STATUS_OPTIONS: StatusFilter[] = ["pending", "accepted", "rejected"];

export function AdminHeader({
  total,
  status,
  onStatusChange,
}: AdminHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-foreground text-2xl font-bold">
          Contribution Review
        </h1>
        <p className="text-muted-foreground text-sm">
          {total} sample{total !== 1 ? "s" : ""} — {status}
        </p>
      </div>

      <Tabs
        value={status}
        onValueChange={(value) => onStatusChange(value as StatusFilter)}
      >
        <TabsList className="rounded-xl px-1">
          {STATUS_OPTIONS.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
