"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/lib/utils";
import { LoaderCircle } from "@workspace/ui/index";
import { LABELS, LABEL_ARABIC, ZIKR_LABELS } from "../constants";
import { formatDate } from "../utils/formatDate";
import type { ActionState, SampleWithUrls, StatusFilter } from "../types";

interface SampleReviewCardProps {
  sample: SampleWithUrls;
  status: StatusFilter;
  actionState: ActionState;
  actionMessage?: string;
  correctedLabel: string;
  onCorrectedLabelChange: (label: string) => void;
  onAccept: () => void;
  onReject: () => void;
}

function AudioTrack({
  label,
  src,
  badge,
}: {
  label: string;
  src: string;
  badge?: string;
}) {
  return (
    <div className="border-border bg-muted/30 space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </span>
        {badge && (
          <Badge variant="outline" className="font-mono text-[10px]">
            {badge}
          </Badge>
        )}
      </div>
      <audio src={src} controls className="h-8 w-full" />
    </div>
  );
}

export function SampleReviewCard({
  sample,
  status,
  actionState,
  actionMessage,
  correctedLabel,
  onCorrectedLabelChange,
  onAccept,
  onReject,
}: SampleReviewCardProps) {
  const isZikr = ZIKR_LABELS.has(sample.label);
  const isPending = status === "pending";
  const isBusy = actionState === "loading" || actionState === "done";
  const title = isZikr ? LABEL_ARABIC[sample.label] : sample.label;

  return (
    <Card
      size="sm"
      className={cn(
        "bg-card gap-0 rounded-2xl ring-0 transition-all duration-500",
        actionState === "done" && "scale-[0.98] opacity-20",
      )}
    >
      <CardHeader className="border-border border-b">
        <CardTitle
          className={cn(isZikr && "text-lg")}
          dir={isZikr ? "rtl" : "ltr"}
          lang={isZikr ? "ar" : "en"}
        >
          {title}
        </CardTitle>
        <CardDescription>{formatDate(sample.created_at)}</CardDescription>
        <CardAction>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Badge variant="secondary">{sample.label}</Badge>
            {sample.variation && sample.variation !== "none" && (
              <Badge variant="outline">{sample.variation}</Badge>
            )}
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        <div
          className="bg-muted/40 text-foreground rounded-lg px-4 py-3 text-sm leading-relaxed"
          dir={isZikr || sample.label === "noise" ? "rtl" : "ltr"}
          lang={isZikr || sample.label === "noise" ? "ar" : "en"}
        >
          {sample.prompt}
        </div>

        {sample.rawAudioUrl || sample.processedAudioUrl ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {sample.rawAudioUrl && (
              <AudioTrack label="Raw recording" src={sample.rawAudioUrl} />
            )}
            {sample.processedAudioUrl && (
              <AudioTrack
                label="After pipeline"
                src={sample.processedAudioUrl}
                badge={sample.pipeline_version ?? undefined}
              />
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-xs italic">
            Audio URL unavailable
          </p>
        )}

        {(sample.pipeline_version || sample.ei_sample_id || actionMessage) && (
          <div className="flex flex-wrap items-center gap-2">
            {sample.pipeline_version && (
              <Badge variant="success" className="font-mono text-[10px]">
                pipeline {sample.pipeline_version}
              </Badge>
            )}
            {sample.ei_sample_id && (
              <Badge variant="info" className="font-mono text-[10px]">
                EI #{sample.ei_sample_id}
              </Badge>
            )}
            {actionMessage && (
              <span
                className={cn(
                  "text-xs",
                  actionState === "error" && "text-destructive",
                  actionState === "done" && "text-success",
                  actionState !== "error" &&
                    actionState !== "done" &&
                    "text-muted-foreground",
                )}
              >
                {actionMessage}
              </span>
            )}
          </div>
        )}
      </CardContent>

      {isPending && (
        <CardFooter className="border-border justify-between gap-3 border-t">
          <Select
            value={correctedLabel}
            onValueChange={(value) => value && onCorrectedLabelChange(value)}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LABELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={onReject}
              disabled={isBusy}
            >
              Reject
            </Button>

            <Button
              variant="success"
              size="sm"
              onClick={onAccept}
              disabled={isBusy}
            >
              {actionState === "loading" ? (
                <>
                  <LoaderCircle className="size-3.5 animate-spin" />
                  {actionMessage?.includes("pipeline")
                    ? "Pushing WAV…"
                    : "Working…"}
                </>
              ) : (
                "Accept and Upload"
              )}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
