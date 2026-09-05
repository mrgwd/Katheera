"use client";

import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { LABELS } from "../constants";
import type { SortDir, SortField } from "../types";
import { ArrowDown, ArrowUp, RotateCw } from "@workspace/ui/index";

interface AdminFiltersProps {
  labelFilter: string;
  sortBy: SortField;
  sortDir: SortDir;
  onLabelFilterChange: (value: string) => void;
  onSortByChange: (value: SortField) => void;
  onSortDirToggle: () => void;
  onRefresh: () => void;
}

export function AdminFilters({
  labelFilter,
  sortBy,
  sortDir,
  onLabelFilterChange,
  onSortByChange,
  onSortDirToggle,
  onRefresh,
}: AdminFiltersProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Label className="text-muted-foreground text-xs">Label</Label>
        <Select
          value={labelFilter}
          onValueChange={(value) => value && onLabelFilterChange(value)}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {LABELS.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-muted-foreground text-xs">Sort</Label>
        <Select
          value={sortBy}
          onValueChange={(value) => onSortByChange(value as SortField)}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Date</SelectItem>
            <SelectItem value="label">Label</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={onSortDirToggle}>
          {sortDir === "desc" ? (
            <>
              <ArrowDown /> Newest
            </>
          ) : (
            <>
              <ArrowUp /> Oldest
            </>
          )}
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="ml-auto"
        onClick={onRefresh}
      >
        <RotateCw /> Refresh
      </Button>
    </div>
  );
}
