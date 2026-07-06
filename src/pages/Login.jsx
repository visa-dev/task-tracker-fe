import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import authService from '../services/authService.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()

  const sessionExpired = searchParams.get('reason') === 'expired'

  const [form, setForm] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Arriving here because a token expired: prefill the username so the person
  // only has to type their password again, rather than the whole form.
  useEffect(() => {
    if (sessionExpired) {
      const lastUsername = localStorage.getItem('lastUsername')
      if (lastUsername) {
        setForm((f) => ({ ...f, username: lastUsername }))
      }
    }
  }, [sessionExpired])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      const res = await authService.login(form)
      localStorage.setItem('lastUsername', form.username)
      login(res.data.data)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      const status = err.response?.status

      if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        // Field-level validation errors (e.g. blank username)
        setErrors(data.data)
      } else if (status === 401) {
        toast.error('Invalid username or password')
      } else if (status === 403) {
        toast.error(data?.message || 'This account has been deactivated')
      } else {
        toast.error(data?.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            T
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to Task Tracker</p>
        </div>

        {sessionExpired && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
            Your session expired. {form.username ? 'Just enter your password to continue.' : 'Please log in again.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-modern">Username</label>
            <input
              className="input-modern"
              name="username"
              value={form.username}
              onChange={handleChange}
              autoFocus={!sessionExpired}
              required
            />
            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
          </div>
          <div>
            <label className="label-modern">Password</label>
            <input
              className="input-modern"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoFocus={sessionExpired}
              required
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>
          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
