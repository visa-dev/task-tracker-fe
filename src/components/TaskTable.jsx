import React, { useState } from 'react'
import SearchableSelect from './SearchableSelect.jsx'

const STATUS_STYLES = {
  UNASSIGNED: 'bg-slate-200 text-slate-600',
  PENDING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
}

const PRIORITY_STYLES = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}

// UNASSIGNED is deliberately not in this list - it's never a manually selectable target,
// only something a task starts as and moves out of via assignment.
const CHANGEABLE_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED']

function EditIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function ChevronRight({ open }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

/** Small inline dropdown styled to look like the status badge itself - click to change status directly.
 *  Disabled entirely (with a tooltip) for a still-Unassigned task, since status can't change until
 *  it has an owner. */
function StatusPicker({ task, onChangeStatus }) {
  const [open, setOpen] = useState(false)
  const locked = task.unassigned

  if (locked) {
    return (
      <span
        className={`inline-flex cursor-not-allowed items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES.UNASSIGNED}`}
        title="Assign this task to a user before changing its status"
      >
        Unassigned
      </span>
    )
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`rounded-full px-2.5 py-1 text-xs font-medium transition hover:opacity-80 ${STATUS_STYLES[task.status]}`}
      >
        {task.status.replace('_', ' ')}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {CHANGEABLE_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setOpen(false)
                  if (s !== task.status) onChangeStatus(task.id, s)
                }}
                className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 ${
                  s === task.status ? 'font-semibold text-brand-700' : 'text-slate-600'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function TaskTable({ tasks, isAdmin, users, onEdit, onDelete, onChangeStatus, onRequestAssign }) {
  const [expandedId, setExpandedId] = useState(null)

  if (!tasks.length) {
    return (
      <div className="card-surface flex flex-col items-center justify-center px-6 py-14 text-center">
        <p className="text-sm font-medium text-slate-500">No tasks found.</p>
        <p className="mt-1 text-xs text-slate-400">Try adjusting your filters, or create a new task.</p>
      </div>
    )
  }

  const toggleExpand = (id) => setExpandedId((cur) => (cur === id ? null : id))

  // Tasks can only go to active, regular (non-admin) users.
  const assignableOptions = users
    .filter((u) => u.active && u.role !== 'ROLE_ADMIN')
    .map((u) => ({ value: u.id, label: u.username }))

  const columnCount = 5 + (isAdmin ? 1 : 0)

  return (
    <div className="card-surface overflow-visible">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3">Title</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Priority</th>
            <th className="px-5 py-3">Due Date</th>
            {isAdmin && <th className="px-5 py-3">Owner</th>}
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => {
            const isExpanded = expandedId === task.id
            return (
              <React.Fragment key={task.id}>
                <tr className="transition hover:bg-slate-50/60">
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleExpand(task.id)}
                      className="flex items-center gap-1.5 text-left font-medium text-slate-800 hover:text-brand-700"
                      title="Click to view description"
                    >
                      <ChevronRight open={isExpanded} />
                      <span>{task.title}</span>
                    </button>
                    {task.isOverdue && (
                      <span className="ml-6 mt-0.5 inline-block text-xs font-medium text-red-600">Overdue</span>
                    )}
                    {task.assignedByUsername && (
                      <span className="ml-6 mt-0.5 block text-xs text-slate-400">
                        Assigned by {task.assignedByUsername}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusPicker task={task} onChangeStatus={onChangeStatus} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}>
                      {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{task.dueDate || '—'}</td>
                  {isAdmin && (
                    <td className="px-5 py-3.5">
                      {task.unassigned ? (
                        <div className="w-40">
                          <SearchableSelect
                            options={assignableOptions}
                            value=""
                            onChange={(val) => {
                              if (!val) return
                              const picked = assignableOptions.find((o) => String(o.value) === String(val))
                              onRequestAssign({
                                taskId: task.id,
                                taskTitle: task.title,
                                userId: Number(val),
                                username: picked?.label || '',
                              })
                            }}
                            placeholder="Assign…"
                            emptyLabel="No active users"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-600">{task.ownerUsername}</span>
                      )}
                    </td>
                  )}
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(task)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                        title="Edit task"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => onDelete(task)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        title="Delete task"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-slate-50/60">
                    <td colSpan={columnCount} className="px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Description</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                        {task.description?.trim() ? task.description : 'No description provided.'}
                      </p>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
