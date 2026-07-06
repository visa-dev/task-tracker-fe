import React from 'react'
import SearchableSelect from './SearchableSelect.jsx'

const STATUS_OPTIONS = ['PENDING', 'IN_PROGRESS', 'COMPLETED']
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

function ChevronDown() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

const isEmpty = (filters) =>
  !filters.status &&
  !filters.priority &&
  !filters.ownerId &&
  !filters.search &&
  !filters.unassigned &&
  !filters.overdue

export default function Filters({ isAdmin, users, filters, onChange }) {
  const update = (patch) => onChange({ ...filters, ...patch })
  const ownerOptions = users.map((u) => ({ value: u.id, label: u.username }))

  return (
    <div className="card-surface h-fit p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Filters</h3>
        {!isEmpty(filters) && (
          <button
            onClick={() => onChange({})}
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="label-modern">Search by title</label>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
              />
            </svg>
            <input
              className="input-modern pl-9"
              placeholder="e.g. quarterly report"
              value={filters.search || ''}
              onChange={(e) => update({ search: e.target.value || undefined })}
            />
          </div>
        </div>

        <div>
          <label className="label-modern">Status</label>
          <div className="relative">
            <select
              className="select-modern"
              value={filters.status || ''}
              onChange={(e) => update({ status: e.target.value || undefined })}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </div>

        <div>
          <label className="label-modern">Priority</label>
          <div className="relative">
            <select
              className="select-modern"
              value={filters.priority || ''}
              onChange={(e) =>
                update({ priority: e.target.value || undefined })
              }
            >
              <option value="">All priorities</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </div>

        {isAdmin && (
          <div>
            <label className="label-modern">Owner</label>
            <SearchableSelect
              options={ownerOptions}
              value={filters.ownerId || ''}
              onChange={(val) => update({ ownerId: val || undefined })}
              placeholder="All owners"
              clearLabel="All owners"
              emptyLabel="No users found"
            />
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            checked={!!filters.overdue}
            onChange={(e) => update({ overdue: e.target.checked || undefined })}
          />
          Overdue only
        </label>

        {isAdmin && (
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={!!filters.unassigned}
              onChange={(e) =>
                update({ unassigned: e.target.checked || undefined })
              }
            />
            Unassigned only
          </label>
        )}
      </div>
    </div>
  )
}
