import apiClient from './apiClient.js'

const taskService = {
  getTasks: (params) => apiClient.get('/tasks', { params }),
  getTaskById: (id) => apiClient.get(`/tasks/${id}`),
  createTask: (payload) => apiClient.post('/tasks', payload),
  updateTask: (id, payload) => apiClient.put(`/tasks/${id}`, payload),
  updateTaskStatus: (id, status) => apiClient.patch(`/tasks/${id}/status`, { status }),
  assignTask: (id, ownerId) => apiClient.patch(`/tasks/${id}/assign`, { ownerId }),
  deleteTask: (id) => apiClient.delete(`/tasks/${id}`),
  getStats: () => apiClient.get('/tasks/stats'),
}

export default taskService
