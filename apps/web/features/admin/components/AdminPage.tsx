"use client";

import { AdminAuthGate } from "./AdminAuthGate";
import { AdminFilters } from "./AdminFilters";
import { AdminHeader } from "./AdminHeader";
import { AdminPagination } from "./AdminPagination";
import { SampleReviewCard } from "./SampleReviewCard";
import { useAdminReview } from "../hooks/useAdminReview";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="border-muted-foreground/30 border-t-foreground size-8 animate-spin rounded-full border-2" />
    </div>
  );
}

export function AdminPage() {
  const {
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
    pageSize,
  } = useAdminReview();

  if (!authed) {
    return (
      <AdminAuthGate
        secret={secret}
        error={error}
        onSecretChange={setSecret}
        onSignIn={signIn}
      />
    );
  }

  return (
    <div>
      <div className="layout max-w-5xl py-10">
        <AdminHeader
          total={total}
          status={status}
          onStatusChange={setStatusFilter}
        />

        <AdminFilters
          labelFilter={labelFilter}
          sortBy={sortBy}
          sortDir={sortDir}
          onLabelFilterChange={setLabelFilterAndReset}
          onSortByChange={setSortByAndReset}
          onSortDirToggle={toggleSortDir}
          onRefresh={fetchSamples}
        />

        {error && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive mb-6 rounded-xl border p-4 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-3">
            {samples.length === 0 ? (
              <p className="text-muted-foreground py-16 text-center">
                No {status} samples found.
              </p>
            ) : (
              samples.map((sample) => (
                <SampleReviewCard
                  key={sample.id}
                  sample={sample}
                  status={status}
                  actionState={actionStates[sample.id] ?? "idle"}
                  actionMessage={actionMessages[sample.id]}
                  correctedLabel={correctedLabels[sample.id] ?? sample.label}
                  onCorrectedLabelChange={(label) =>
                    setCorrectedLabel(sample.id, label)
                  }
                  onAccept={() => reviewSample(sample.id, "accept")}
                  onReject={() => reviewSample(sample.id, "reject")}
                />
              ))
            )}
          </div>
        )}

        {!loading && total > pageSize && (
          <AdminPagination
            page={page}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
