import React from 'react'

const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-9 w-9 border-[3px]',
}

export function Spinner({ size = 'md', className = '' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-slate-200 border-t-brand-600 ${SIZES[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}

export function LoadingBlock({ label = 'Loading…' }) {
  return (
    <div className="card-surface flex flex-col items-center justify-center gap-3 p-12">
      <Spinner size="lg" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}
