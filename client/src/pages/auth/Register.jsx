import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import AuthCard from '../../components/AuthCard'
import Input from '../../components/Input'
import PasswordInput from '../../components/PasswordInput'
import Button from '../../components/Button'

const EMAIL_REGEX = /^\S+@\S+\.\S+$/

const initialForm = {
  role: 'student',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  designation: '',
  website: '',
  phone: '',
}

const Register = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // /register?role=recruiter opens the form with Recruiter already selected
  const [form, setForm] = useState(() => ({ ...initialForm, role: searchParams.get('role') === 'recruiter' ? 'recruiter' : 'student' }))
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const isRecruiter = form.role === 'recruiter'

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  // Same rules as the backend, so users see mistakes before the request is sent
  const validate = () => {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (!EMAIL_REGEX.test(form.email.trim())) newErrors.email = 'Please enter a valid email'
    if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    if (isRecruiter && !form.companyName.trim()) newErrors.companyName = 'Company name is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      role: form.role,
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    }
    if (isRecruiter) {
      payload.companyName = form.companyName.trim()
      payload.designation = form.designation.trim()
      payload.website = form.website.trim()
      payload.phone = form.phone.trim()
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/register', payload)
      toast.success(res.data.message)
      // sent=1 tells the OTP page that an OTP was just sent, so it starts the resend timer
      navigate(`/verify-email?email=${encodeURIComponent(payload.email)}&sent=1`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Create an account"
      subtitle="Recruiter accounts need approval from the placement office"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Role switch */}
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
          {['student', 'recruiter'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setForm({ ...form, role })}
              className={`rounded-md py-2 text-sm font-medium capitalize ${
                form.role === role ? 'bg-white text-blue-700 shadow' : 'text-gray-600'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <Input label="Full name" id="name" name="name" value={form.name} onChange={handleChange} error={errors.name} autoComplete="name" />
        <Input label={isRecruiter ? 'Work email' : 'Email'} id="email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} autoComplete="email" />

        {isRecruiter && (
          <>
            <Input label="Company name" id="companyName" name="companyName" value={form.companyName} onChange={handleChange} error={errors.companyName} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Designation (optional)" id="designation" name="designation" value={form.designation} onChange={handleChange} />
              <Input label="Phone (optional)" id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
            </div>
            <Input label="Company website (optional)" id="website" name="website" type="url" placeholder="https://" value={form.website} onChange={handleChange} />
          </>
        )}

        <PasswordInput label="Password" id="password" name="password" value={form.password} onChange={handleChange} error={errors.password} autoComplete="new-password" />
        <PasswordInput label="Confirm password" id="confirmPassword" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} autoComplete="new-password" />

        <Button type="submit" loading={loading} className="w-full">
          Register as {form.role}
        </Button>
      </form>
    </AuthCard>
  )
}

export default Register
