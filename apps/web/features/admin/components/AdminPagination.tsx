"use client";

import { Button } from "@workspace/ui/components/button";

interface AdminPaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({
  page,
  total,
  pageSize,
  onPageChange,
}: AdminPaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mt-6 flex items-center justify-center gap-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
      >
        ← Prev
      </Button>
      <span className="text-muted-foreground text-sm">
        Page {page + 1} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={(page + 1) * pageSize >= total}
      >
        Next →
      </Button>
    </div>
  );
}
