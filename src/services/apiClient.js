import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL
  console.log('API BASE URL:', import.meta.env.VITE_API_BASE_URL)

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT token to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Endpoints where a 401 means "these credentials were wrong" (an expected, recoverable
// error the calling page already handles) - NOT "your session expired". These must be
// excluded from the auto-logout/redirect flow below, otherwise a bad password on the
// Login page incorrectly triggers a "Session expired" toast + redirect loop.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register']

function isAuthEndpoint(url = '') {
  return AUTH_ENDPOINTS.some((path) => url.includes(path))
}

// Guards against multiple simultaneous 401s (e.g. tasks + stats + users firing at once
// when a token expires) each independently trying to redirect/toast.
let isRedirectingToLogin = false

// If the API returns 401 on an *authenticated* endpoint (i.e. not login/register itself),
// the token is missing/expired/invalid - clear session and send the user back to Login
// with enough context to make re-authenticating fast (username prefilled, password-only).
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
        if (lastUsername) {
          localStorage.setItem('lastUsername', lastUsername)
        }

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
