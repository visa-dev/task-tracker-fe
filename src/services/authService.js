import apiClient from './apiClient.js'

const authService = {
  register: (payload) => apiClient.post('/auth/register', payload),
  login: (payload) => apiClient.post('/auth/login', payload),
}

export default authService
