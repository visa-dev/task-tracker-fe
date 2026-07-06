import React, { useEffect } from 'react'

export default function Pagination({ page, totalPages, onPageChange }) {
  // Edge case: if current page (0-indexed) is beyond the last available page, snap back.
  useEffect(() => {
    if (totalPages > 0 && page > totalPages - 1) {
      onPageChange(totalPages - 1)
    }
  }, [page, totalPages, onPageChange])

  if (totalPages <= 1) return null

  return (
    <div className="mt-5 flex items-center justify-center gap-3">
      <button
        className="btn-secondary px-3 py-2 text-xs"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </button>
      <span className="text-sm text-slate-500">
        Page <span className="font-medium text-slate-700">{page + 1}</span> of {totalPages}
      </span>
      <button
        className="btn-secondary px-3 py-2 text-xs"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  )
}
