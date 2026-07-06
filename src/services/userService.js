import apiClient from './apiClient.js'

const userService = {
  getAllUsers: () => apiClient.get('/users'),
  setUserStatus: (id, active) => apiClient.patch(`/users/${id}/status`, { active }),
}

export default userService
