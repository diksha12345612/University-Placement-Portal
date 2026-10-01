import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import AuthCard from '../../components/AuthCard'
import Input from '../../components/Input'
import PasswordInput from '../../components/PasswordInput'
import Button from '../../components/Button'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [form, setForm] = useState({
    email: searchParams.get('email') || '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: name === 'otp' ? value.replace(/\D/g, '') : value })
    setErrors({ ...errors, [name]: '' })
  }

  const validate = () => {
    const newErrors = {}
    if (!form.email.trim()) newErrors.email = 'Email is required'
    if (!/^\d{6}$/.test(form.otp)) newErrors.otp = 'Enter the 6-digit OTP from your email'
    if (form.newPassword.length < 6) newErrors.newPassword = 'Password must be at least 6 characters'
    if (form.newPassword !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await api.post('/auth/reset-password', {
        email: form.email.trim(),
        otp: form.otp,
        newPassword: form.newPassword,
      })
      toast.success(res.data.message)
      navigate('/login', { state: { email: form.email.trim() } })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Reset password"
      subtitle="Enter the OTP sent to your email and choose a new password"
      footer={
        <>
          Didn&apos;t get an OTP?{' '}
          <Link to="/forgot-password" className="text-blue-600 hover:underline">
            Send again
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input label="Email" id="email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
        <Input label="OTP" id="otp" name="otp" inputMode="numeric" maxLength={6} value={form.otp} onChange={handleChange} error={errors.otp} autoComplete="one-time-code" />
        <PasswordInput label="New password" id="newPassword" name="newPassword" value={form.newPassword} onChange={handleChange} error={errors.newPassword} autoComplete="new-password" />
        <PasswordInput label="Confirm new password" id="confirmPassword" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} autoComplete="new-password" />
        <Button type="submit" loading={loading} className="w-full">
          Reset password
        </Button>
      </form>
    </AuthCard>
  )
}

export default ResetPassword
