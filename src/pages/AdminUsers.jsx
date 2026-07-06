import React, { useEffect, useState, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import userService from '../services/userService.js'
import { useAuth } from '../context/AuthContext.jsx'
import Layout from '../components/Layout.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { LoadingBlock } from '../components/Spinner.jsx'

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingToggle, setPendingToggle] = useState(null) // { id, username, nextActive }
  const [saving, setSaving] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await userService.getAllUsers()
      setUsers(res.data.data)
    } catch (err) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const counts = useMemo(() => {
    const active = users.filter((u) => u.active).length
    return { total: users.length, active, deactivated: users.length - active }
  }, [users])

  const requestToggle = (u) => {
    setPendingToggle({ id: u.id, username: u.username, nextActive: !u.active })
  }

  const confirmToggle = async () => {
    if (!pendingToggle) return
    setSaving(true)
    try {
      await userService.setUserStatus(pendingToggle.id, pendingToggle.nextActive)
      toast.success(pendingToggle.nextActive ? 'User activated' : 'User deactivated')
      setPendingToggle(null)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">Activate or deactivate accounts. Deactivated users cannot log in.</p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="card-surface relative overflow-hidden p-4">
          <span className="absolute inset-y-0 left-0 w-1 bg-brand-500" />
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Users</p>
          <p className="mt-0.5 text-2xl font-semibold text-slate-900">{counts.total}</p>
        </div>
        <div className="card-surface relative overflow-hidden p-4">
          <span className="absolute inset-y-0 left-0 w-1 bg-green-500" />
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Active</p>
          <p className="mt-0.5 text-2xl font-semibold text-slate-900">{counts.active}</p>
        </div>
        <div className="card-surface relative overflow-hidden p-4">
          <span className="absolute inset-y-0 left-0 w-1 bg-slate-400" />
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Deactivated</p>
          <p className="mt-0.5 text-2xl font-semibold text-slate-900">{counts.deactivated}</p>
        </div>
      </div>

      {loading ? (
        <LoadingBlock label="Loading users…" />
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Username</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="transition hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {u.username}
                    {u.id === currentUser?.id && (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">You</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {u.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        u.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${u.active ? 'bg-green-500' : 'bg-slate-400'}`} />
                      {u.active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => requestToggle(u)}
                      disabled={u.id === currentUser?.id}
                      title={u.id === currentUser?.id ? "You can't deactivate your own account" : undefined}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        u.active
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {u.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingToggle}
        title={pendingToggle?.nextActive ? 'Activate this user?' : 'Deactivate this user?'}
        message={
          pendingToggle?.nextActive
            ? `${pendingToggle?.username} will be able to log in again.`
            : `${pendingToggle?.username} will be immediately signed out and won't be able to log in until reactivated.`
        }
        confirmLabel={pendingToggle?.nextActive ? 'Activate' : 'Deactivate'}
        tone={pendingToggle?.nextActive ? 'default' : 'danger'}
        loading={saving}
        onConfirm={confirmToggle}
        onCancel={() => setPendingToggle(null)}
      />
    </Layout>
  )
}
