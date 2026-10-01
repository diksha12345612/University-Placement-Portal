import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import AuthCard from '../../components/AuthCard'
import Input from '../../components/Input'
import Button from '../../components/Button'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email')

    setLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() })
      toast.success(res.data.message)
      navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter your registered email and we will send you an OTP"
      footer={
        <Link to="/login" className="text-blue-600 hover:underline">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Email"
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError('')
          }}
          error={error}
          autoComplete="email"
        />
        <Button type="submit" loading={loading} className="w-full">
          Send OTP
        </Button>
      </form>
    </AuthCard>
  )
}

export default ForgotPassword
