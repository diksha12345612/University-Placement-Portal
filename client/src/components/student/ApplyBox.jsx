import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Button from '../Button'
import StatusBadge from '../StatusBadge'

// The bottom part of the job page: shows why you cannot apply, or the apply form.
// The backend checks all of these rules again when the form is submitted.
const ApplyBox = ({ job, onApplied }) => {
  const { user } = useAuth()
  const [coverLetter, setCoverLetter] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const hasResume = Boolean(user.studentProfile?.resumePublicId)

  if (job.myApplicationStatus) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span>You have applied. Status:</span>
        <StatusBadge status={job.myApplicationStatus} />
        <Link to="/student/applications" className="text-blue-600 hover:underline">
          View my applications
        </Link>
      </div>
    )
  }

  if (!job.eligibilityCheck.isEligible) {
    return <p className="text-sm text-gray-600">You cannot apply because you do not meet the eligibility rules above.</p>
  }

  if (!hasResume) {
    return (
      <p className="text-sm text-yellow-800">
        Upload your resume in{' '}
        <Link to="/student/profile" className="font-medium underline">
          My Profile
        </Link>{' '}
        before applying.
      </p>
    )
  }

  const handleApply = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await api.post(`/jobs/${job._id}/apply`, { coverLetter: coverLetter.trim() })
      toast.success(res.data.message)
      onApplied(res.data.application.status)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleApply} className="space-y-3">
      <div>
        <label htmlFor="coverLetter" className="mb-1 block text-sm font-medium text-gray-700">
          Cover letter (optional)
        </label>
        <textarea
          id="coverLetter"
          rows={4}
          maxLength={2000}
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Why are you a good fit for this role?"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
        <p className="text-right text-xs text-gray-400">{coverLetter.length}/2000</p>
      </div>
      <p className="text-xs text-gray-500">Your profile and current resume will be shared with the recruiter.</p>
      <Button type="submit" loading={submitting}>
        Apply now
      </Button>
    </form>
  )
}

export default ApplyBox
