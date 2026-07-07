import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT token to every outgoing request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register']

function isAuthEndpoint(url = '') {
  return AUTH_ENDPOINTS.some((path) => url.includes(path))
}

let isRedirectingToLogin = false

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''

    if (status === 401 && !isAuthEndpoint(url)) {
      if (!isRedirectingToLogin) {
        isRedirectingToLogin = true

        const lastUsername = localStorage.getItem('lastUsername')

        localStorage.removeItem('token')
        localStorage.removeItem('user')

        toast.error('Your session expired. Please log in again.')

        if (window.location.pathname !== '/login') {
          window.location.href = '/login?reason=expired'
        }
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient
