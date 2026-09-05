"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PIPELINE_VERSION } from "@workspace/azkar/constants";
import { PAGE_SIZE } from "../constants";
import { pushToEI } from "../utils/pushToEI";
import type {
  ActionState,
  SampleWithUrls,
  SortDir,
  SortField,
  StatusFilter,
} from "../types";

export function useAdminReview() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [labelFilter, setLabelFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [samples, setSamples] = useState<SampleWithUrls[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionStates, setActionStates] = useState<
    Record<string, ActionState>
  >({});
  const [actionMessages, setActionMessages] = useState<Record<string, string>>(
    {},
  );
  const [correctedLabels, setCorrectedLabels] = useState<
    Record<string, string>
  >({});
  const abortRef = useRef<AbortController | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Abort in-flight list fetches and pending advance timers on unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const fetchSamples = useCallback(async () => {
    // Cancel the previous request so rapid filter/pagination changes can't
    // resolve out of order (last response wins would be arbitrary).
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        status,
        sort: sortBy,
        dir: sortDir,
        page: String(page),
      });
      if (labelFilter !== "all") params.set("label", labelFilter);

      const res = await fetch(`/api/contribute/review?${params}`, {
        headers: { Authorization: `Bearer ${secret}` },
        signal: controller.signal,
      });
      if (res.status === 401) {
        setAuthed(false);
        setError("Invalid secret");
        return;
      }
      const data = await res.json();
      setSamples(data.samples ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Network error");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [secret, status, labelFilter, sortBy, sortDir, page]);

  useEffect(() => {
    if (authed) fetchSamples();
  }, [authed, fetchSamples]);

  const signIn = useCallback(() => {
    setError(null);
    setAuthed(true);
  }, []);

  const setStatusFilter = useCallback((next: StatusFilter) => {
    setStatus(next);
    setPage(0);
  }, []);

  const setLabelFilterAndReset = useCallback((next: string) => {
    setLabelFilter(next);
    setPage(0);
  }, []);

  const setSortByAndReset = useCallback((next: SortField) => {
    setSortBy(next);
    setPage(0);
  }, []);

  const toggleSortDir = useCallback(() => {
    setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    setPage(0);
  }, []);

  const setCorrectedLabel = useCallback((sampleId: string, label: string) => {
    setCorrectedLabels((prev) => ({ ...prev, [sampleId]: label }));
  }, []);

  const reviewSample = useCallback(
    async (sampleId: string, action: "accept" | "reject") => {
      setActionStates((s) => ({ ...s, [sampleId]: "loading" }));
      setActionMessages((m) => ({
        ...m,
        [sampleId]: action === "accept" ? "Accepting…" : "Rejecting…",
      }));

      try {
        const res = await fetch("/api/contribute/review", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secret}`,
          },
          body: JSON.stringify({
            sample_id: sampleId,
            action,
            corrected_label: correctedLabels[sampleId],
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            (data as { detail?: string; error?: string }).detail ??
              (data as { error?: string }).error ??
              "Server error",
          );
        }

        const result = await res.json();

        if (action === "accept" && result.rawAudioUrl) {
          const effectiveLabel =
            correctedLabels[sampleId] ??
            samples.find((s) => s.id === sampleId)?.label ??
            "unknown";

          setActionMessages((m) => ({
            ...m,
            [sampleId]: "Decoding + pipeline…",
          }));
          const eiSampleId = await pushToEI(
            result.rawAudioUrl,
            effectiveLabel,
            sampleId,
            secret,
          );

          setActionMessages((m) => ({ ...m, [sampleId]: "Saving EI ID…" }));
          await fetch("/api/contribute/review", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${secret}`,
            },
            body: JSON.stringify({
              sample_id: sampleId,
              action: "update_ei",
              ei_sample_id: eiSampleId,
              pipeline_version: PIPELINE_VERSION,
            }),
          });

          setActionMessages((m) => ({
            ...m,
            [sampleId]: `✓ Pushed to EI as #${eiSampleId} (pipeline ${PIPELINE_VERSION})`,
          }));
        }

        setActionStates((s) => ({ ...s, [sampleId]: "done" }));
        if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = setTimeout(() => {
          setSamples((prev) => prev.filter((s) => s.id !== sampleId));
          setTotal((t) => t - 1);
        }, 1500);
      } catch (err) {
        setActionStates((s) => ({ ...s, [sampleId]: "error" }));
        const msg = err instanceof Error ? err.message : "Action failed";
        setActionMessages((m) => ({ ...m, [sampleId]: `✗ ${msg}` }));
      }
    },
    [secret, correctedLabels, samples],
  );

  return {
    secret,
    setSecret,
    authed,
    signIn,
    status,
    setStatusFilter,
    labelFilter,
    setLabelFilterAndReset,
    sortBy,
    setSortByAndReset,
    sortDir,
    toggleSortDir,
    samples,
    total,
    page,
    setPage,
    loading,
    error,
    fetchSamples,
    actionStates,
    actionMessages,
    correctedLabels,
    setCorrectedLabel,
    reviewSample,
    pageSize: PAGE_SIZE,
  };
}
