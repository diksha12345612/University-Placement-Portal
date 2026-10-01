import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import AuthCard from '../../components/AuthCard'
import Input from '../../components/Input'
import Button from '../../components/Button'

const RESEND_SECONDS = 60 // same as the backend cooldown

const VerifyEmail = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  // If we came straight from Register, an OTP was just sent, so start the timer
  const [cooldown, setCooldown] = useState(searchParams.get('sent') ? RESEND_SECONDS : 0)

  // Count down by 1 every second until 0
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!email.trim()) return setError('Email is required')
    if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit OTP from your email')

    setLoading(true)
    try {
      const res = await api.post('/auth/verify-email', { email: email.trim(), otp })
      toast.success(res.data.message)
      navigate('/login', { state: { email: email.trim() } })
    } catch (err) {
      toast.error(getErrorMessage(err))
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email.trim()) return setError('Enter your email first')

    setResending(true)
    try {
      const res = await api.post('/auth/resend-otp', { email: email.trim() })
      toast.success(res.data.message)
      setCooldown(RESEND_SECONDS)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthCard
      title="Verify your email"
      subtitle="We sent a 6-digit OTP to your email. It is valid for 10 minutes."
      footer={
        <Link to="/login" className="text-blue-600 hover:underline">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleVerify} className="space-y-4" noValidate>
        <Input
          label="Email"
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError('')
          }}
        />
        <Input
          label="OTP"
          id="otp"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          value={otp}
          // keep digits only
          onChange={(e) => {
            setOtp(e.target.value.replace(/\D/g, ''))
            setError('')
          }}
          error={error}
          autoComplete="one-time-code"
        />

        <Button type="submit" loading={loading} className="w-full">
          Verify email
        </Button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-600">
        Didn&apos;t get the email? Check spam, or{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="font-medium text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
        >
          {cooldown > 0 ? `resend in ${cooldown}s` : resending ? 'sending...' : 'resend OTP'}
        </button>
      </div>
    </AuthCard>
  )
}

export default VerifyEmail
