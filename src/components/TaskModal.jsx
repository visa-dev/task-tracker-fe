import React, { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import SearchableSelect from './SearchableSelect.jsx'

const ALL_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED']
const ALL_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const todayStr = () => new Date().toISOString().split('T')[0]

function ChevronDown() {
  return (
    <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function TaskModal({ mode, task, isAdmin, users, onClose, onSubmit }) {
  const isEdit = mode === 'edit'
  const isUnassigned = isEdit && !!task?.unassigned

  const initialForm = useMemo(
    () => ({
      title: (isEdit && task?.title) || '',
      description: (isEdit && task?.description) || '',
      status: (isEdit && task?.status) || 'PENDING',
      priority: (isEdit && task?.priority) || 'MEDIUM',
      dueDate: (isEdit && task?.dueDate) || '',
      ownerId: '',
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const [form, setForm] = useState(initialForm)
  const [touched, setTouched] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const titleMissing = touched && !form.title.trim()
  const descriptionMissing = touched && !form.description.trim()
  const dueDateMissing = touched && !form.dueDate
  const dueDateInPast = touched && form.dueDate && !isEdit && form.dueDate < todayStr()

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)

    if (!form.title.trim() || !form.description.trim() || !form.dueDate) {
      toast.error('Title, description, and due date are all required')
      return
    }

    // Due date can't be in the past - only enforced on create. Editing an already-overdue
    // task without touching its due date must still be allowed.
    if (!isEdit && form.dueDate < todayStr()) {
      toast.error('Due date cannot be in the past')
      return
    }

    if (isEdit) {
      // Only save if something actually changed - avoids a no-op PUT request.
      const hasChanges =
        form.title !== initialForm.title ||
        form.description !== initialForm.description ||
        form.status !== initialForm.status ||
        form.priority !== initialForm.priority ||
        (form.dueDate || '') !== (initialForm.dueDate || '')

      if (!hasChanges) {
        toast('No changes to save', { icon: 'ℹ️' })
        onClose()
        return
      }

      const payload = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        dueDate: form.dueDate,
      }
      // A task must be assigned before its status can change - don't even send a status
      // value for an Unassigned task (it was disabled in the UI, but stay defensive).
      if (!isUnassigned) {
        payload.status = form.status
      }
      onSubmit(payload)
      return
    }

    // Create mode: status is never sent (server always decides IN_PROGRESS vs PENDING/Unassigned).
    const payload = {
      title: form.title,
      description: form.description,
      priority: form.priority,
      dueDate: form.dueDate,
    }
    if (isAdmin && form.ownerId) {
      payload.ownerId = Number(form.ownerId)
    }
    onSubmit(payload)
  }

  // Tasks can only go to active, regular (non-admin) users.
  const assignableOptions = users
    .filter((u) => u.active && u.role !== 'ROLE_ADMIN')
    .map((u) => ({ value: u.id, label: u.username }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="mb-5 text-lg font-semibold text-slate-900">
          {isEdit ? 'Edit Task' : 'Create Task'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="label-modern">Title <span className="text-red-500">*</span></label>
            <input
              className={`input-modern ${titleMissing ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`}
              name="title" value={form.title} onChange={handleChange}
            />
            {titleMissing && <p className="mt-1 text-xs text-red-600">Title is required</p>}
          </div>

          <div>
            <label className="label-modern">Description <span className="text-red-500">*</span></label>
            <textarea
              className={`input-modern resize-none ${descriptionMissing ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`}
              name="description" rows={3} value={form.description} onChange={handleChange}
            />
            {descriptionMissing && <p className="mt-1 text-xs text-red-600">Description is required</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-modern">Due Date <span className="text-red-500">*</span></label>
              <input
                className={`input-modern ${(dueDateMissing || dueDateInPast) ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`}
                type="date" name="dueDate" value={form.dueDate} onChange={handleChange}
                min={!isEdit ? todayStr() : undefined}
              />
              {dueDateMissing && <p className="mt-1 text-xs text-red-600">Due date is required</p>}
              {dueDateInPast && <p className="mt-1 text-xs text-red-600">Due date can't be in the past</p>}
            </div>

            <div>
              <label className="label-modern">Priority</label>
              <div className="relative">
                <select className="select-modern" name="priority" value={form.priority} onChange={handleChange}>
                  {ALL_PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </div>
          </div>

          {isEdit && (
            <div>
              <label className="label-modern">Status</label>
              <div className="relative">
                <select
                  className={`select-modern ${isUnassigned ? 'cursor-not-allowed opacity-50' : ''}`}
                  name="status" value={form.status} onChange={handleChange}
                  disabled={isUnassigned}
                  title={isUnassigned ? 'Assign this task to a user before changing its status' : undefined}
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
                <ChevronDown />
              </div>
              {isUnassigned && (
                <p className="mt-1.5 text-xs text-amber-600">
                  Assign this task to a user first - status can't change while Unassigned.
                </p>
              )}
            </div>
          )}

          {!isEdit && isAdmin && (
            <div>
              <label className="label-modern">Assign to</label>
              <SearchableSelect
                options={assignableOptions}
                value={form.ownerId}
                onChange={(val) => setForm({ ...form, ownerId: val })}
                placeholder="Myself (unassigned)"
                clearLabel="Myself (unassigned)"
                emptyLabel="No active users found"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Leave as "Myself" to keep this task for your own list, or search and pick a user.
                Only active, non-admin users are listed.
              </p>
            </div>
          )}

          {!isEdit && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              {isAdmin
                ? 'Left unassigned, this task goes to the Unassigned bucket until someone picks it up.'
                : 'New tasks you create start as "In Progress".'}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2.5">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{isEdit ? 'Save' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
