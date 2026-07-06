import React, { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import taskService from '../services/taskService.js'
import userService from '../services/userService.js'
import websocketService from '../services/websocketService.js'
import { useAuth } from '../context/AuthContext.jsx'
import Layout from '../components/Layout.jsx'
import SummaryCards from '../components/SummaryCards.jsx'
import Filters from '../components/Filters.jsx'
import TaskTable from '../components/TaskTable.jsx'
import Pagination from '../components/Pagination.jsx'
import TaskModal from '../components/TaskModal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { LoadingBlock } from '../components/Spinner.jsx'

const PAGE_SIZE = 10

export default function Dashboard() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ROLE_ADMIN'

  const [tasks, setTasks] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState({})
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  const [modalState, setModalState] = useState({
    open: false,
    mode: 'create',
    task: null,
  })
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filtersRef = useRef(filters)
  const pageRef = useRef(page)
  filtersRef.current = filters
  pageRef.current = page

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: pageRef.current,
        size: PAGE_SIZE,
        ...filtersRef.current,
      }
      const res = await taskService.getTasks(params)
      const data = res.data.data
      setTasks(data.content)
      setTotalPages(data.totalPages)
    } catch (err) {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await taskService.getStats()
      setStats(res.data.data)
    } catch (err) {
      toast.error('Failed to load stats')
    }
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchStats()
  }, [page, filters, fetchTasks, fetchStats])

  // Admin-only: user list for the owner filter / assign dropdowns
  useEffect(() => {
    if (isAdmin) {
      userService
        .getAllUsers()
        .then((res) => setUsers(res.data.data))
        .catch(() => toast.error('Failed to load users'))
    }
  }, [isAdmin])

  // Real-time updates via WebSocket
  useEffect(() => {
    websocketService.connect(() => {
      websocketService.subscribeToTasks(() => {
        fetchTasks()
        fetchStats()
      })
    })
    return () => websocketService.disconnect()
  }, [fetchTasks, fetchStats])

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setPage(0)
  }

  const openCreateModal = () =>
    setModalState({ open: true, mode: 'create', task: null })
  const openEditModal = (task) =>
    setModalState({ open: true, mode: 'edit', task })
  const closeModal = () =>
    setModalState({ open: false, mode: 'create', task: null })

  const handleModalSubmit = async (payload) => {
    try {
      if (modalState.mode === 'edit') {
        await taskService.updateTask(modalState.task.id, payload)
        toast.success('Task updated')
      } else {
        await taskService.createTask(payload)
        toast.success('Task created')
      }
      closeModal()
      fetchTasks()
      fetchStats()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    }
  }

  const handleChangeStatus = async (taskId, newStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus)
      toast.success('Status updated')
      fetchTasks()
      fetchStats()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const [pendingAssign, setPendingAssign] = useState(null)
  const [assigning, setAssigning] = useState(false)

  const requestAssign = (payload) => setPendingAssign(payload)

  const confirmAssign = async () => {
    if (!pendingAssign) return
    setAssigning(true)
    try {
      await taskService.assignTask(pendingAssign.taskId, pendingAssign.userId)
      toast.success('Task assigned')
      setPendingAssign(null)
      fetchTasks()
      fetchStats()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign task')
    } finally {
      setAssigning(false)
    }
  }

  const requestDelete = (task) => setPendingDelete(task)

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await taskService.deleteTask(pendingDelete.id)
      toast.success('Task deleted')
      setPendingDelete(null)
      fetchTasks()
      fetchStats()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {isAdmin ? 'All Tasks' : 'My Tasks'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? 'Manage tasks across every user.'
              : 'Track and update your tasks.'}
          </p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Task
        </button>
      </div>

      <SummaryCards
        stats={stats}
        isAdmin={isAdmin}
        filters={filters}
        onChange={handleFiltersChange}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          {loading ? (
            <LoadingBlock label="Loading tasks…" />
          ) : (
            <TaskTable
              tasks={tasks}
              isAdmin={isAdmin}
              users={users}
              onEdit={openEditModal}
              onDelete={requestDelete}
              onChangeStatus={handleChangeStatus}
              onRequestAssign={requestAssign}
            />
          )}
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>

        <div className="lg:order-last">
          <Filters
            isAdmin={isAdmin}
            users={users}
            filters={filters}
            onChange={handleFiltersChange}
          />
        </div>
      </div>

      {modalState.open && (
        <TaskModal
          mode={modalState.mode}
          task={modalState.task}
          isAdmin={isAdmin}
          users={users}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this task?"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" will be permanently deleted. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={!!pendingAssign}
        title="Assign this task?"
        message={
          pendingAssign
            ? `Assign "${pendingAssign.taskTitle}" to ${pendingAssign.username}?`
            : ''
        }
        confirmLabel="Assign"
        tone="default"
        loading={assigning}
        onConfirm={confirmAssign}
        onCancel={() => setPendingAssign(null)}
      />
    </Layout>
  )
}
