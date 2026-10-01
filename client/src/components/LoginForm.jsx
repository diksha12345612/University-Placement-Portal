import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../services/api'
import { getDashboardPath } from '../utils/roleRoutes'
import Input from './Input'
import PasswordInput from './PasswordInput'
import Button from './Button'

// The login form. Used on the Login page and inside the landing page hero.
const LoginForm = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: location.state?.email || '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const validate = () => {
    const newErrors = {}
    if (!form.email.trim()) newErrors.email = 'Email is required'
    if (!form.password) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const user = await login(form.email.trim(), form.password)
      toast.success(`Welcome, ${user.name}`)

      // Go back to the page they tried to open, if it belongs to their role
      const from = location.state?.from
      const target = from && from.startsWith(`/${user.role}`) ? from : getDashboardPath(user.role)
      navigate(target, { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error))
      if (error.response?.data?.needsVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(form.email.trim())}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input label="Email Address" id="email" name="email" type="email" placeholder="Enter your email" value={form.email} onChange={handleChange} error={errors.email} autoComplete="email" />
      <PasswordInput label="Password" id="password" name="password" placeholder="Enter your password" value={form.password} onChange={handleChange} error={errors.password} autoComplete="current-password" />

      <div className="text-right">
        <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" loading={loading} className="w-full py-3">
        Sign In
      </Button>
    </form>
  )
}

export default LoginForm
