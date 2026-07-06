import React from 'react'

const BASE_CARDS = [
  { key: 'total', label: 'Total', accent: 'bg-brand-500', text: 'text-brand-700', bg: 'bg-brand-50' },
  { key: 'pending', label: 'Pending', accent: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  { key: 'inProgress', label: 'In Progress', accent: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
  { key: 'completed', label: 'Completed', accent: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
]

/**
 * Overdue (and Unassigned, for Admins) are clickable - clicking applies the matching
 * filter so the table below immediately shows just those tasks (with owners visible
 * for Admins), instead of just displaying a number with no way to act on it.
 */
export default function SummaryCards({ stats, isAdmin, filters, onChange }) {
  const values = {
    total: stats?.total ?? 0,
    pending: stats?.pending ?? 0,
    inProgress: stats?.inProgress ?? 0,
    completed: stats?.completed ?? 0,
    overdue: stats?.overdue ?? 0,
    unassigned: stats?.unassigned ?? 0,
  }

  const cards = [...BASE_CARDS, { key: 'overdue', label: 'Overdue', accent: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' }]
  if (isAdmin) {
    cards.push({ key: 'unassigned', label: 'Unassigned', accent: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100' })
  }

  const toggleClickableFilter = (key) => {
    if (key === 'overdue') {
      onChange({ ...filters, overdue: filters.overdue ? undefined : true })
    } else if (key === 'unassigned') {
      onChange({ ...filters, unassigned: filters.unassigned ? undefined : true })
    }
  }

  return (
    <div className={`mb-6 grid grid-cols-2 gap-4 ${isAdmin ? 'sm:grid-cols-3 lg:grid-cols-6' : 'sm:grid-cols-5'}`}>
      {cards.map((c) => {
        const clickable = c.key === 'overdue' || c.key === 'unassigned'
        const active = (c.key === 'overdue' && !!filters.overdue) || (c.key === 'unassigned' && !!filters.unassigned)

        return (
          <button
            key={c.key}
            type="button"
            disabled={!clickable}
            onClick={() => clickable && toggleClickableFilter(c.key)}
            className={`card-surface relative overflow-hidden p-4 text-left transition ${
              clickable ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
            } ${active ? 'ring-2 ring-brand-400' : ''}`}
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${c.accent}`} />
            <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${c.bg} ${c.text} text-xs font-bold`}>
              {values[c.key]}
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{c.label}</p>
            <p className="mt-0.5 text-2xl font-semibold text-slate-900">{values[c.key]}</p>
            {clickable && <p className="mt-0.5 text-[11px] text-slate-400">{active ? 'Click to clear' : 'Click to view'}</p>}
          </button>
        )
      })}
    </div>
  )
}
