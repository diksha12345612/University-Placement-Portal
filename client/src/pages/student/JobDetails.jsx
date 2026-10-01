import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import JobInfo from '../../components/JobInfo'
import Spinner from '../../components/Spinner'
import ApplyBox from '../../components/student/ApplyBox'

const JobDetails = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [job, setJob] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get(`/jobs/${id}`)
      .then((res) => setJob(res.data.job))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spinner />

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-600">{error}</p>
        <Link to="/student/jobs" className="mt-3 inline-block text-blue-600 hover:underline">
          Back to jobs
        </Link>
      </div>
    )
  }

  const { isEligible, reasons } = job.eligibilityCheck

  // Which preferred skills the student already has (case-insensitive)
  const mySkills = (user.studentProfile?.skills || []).map((s) => s.toLowerCase())
  const preferred = job.eligibility?.skills || []
  const matched = preferred.filter((s) => mySkills.includes(s.toLowerCase()))

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/student/jobs" className="text-sm text-blue-600 hover:underline">
        &larr; Back to jobs
      </Link>

      <div className="mt-3 card p-6">
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <p className="mt-1 text-gray-600">{job.company}</p>

        {/* Eligibility result for this student */}
        <div className={`mt-4 rounded-lg p-4 text-sm ${isEligible ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {isEligible ? (
            <p className="font-medium">You are eligible for this job.</p>
          ) : (
            <>
              <p className="font-medium">You are not eligible for this job:</p>
              <ul className="mt-1 list-disc pl-5">
                {reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </>
          )}
          {preferred.length > 0 && (
            <p className="mt-2">
              You have {matched.length} of {preferred.length} preferred skills
              {matched.length > 0 && `: ${matched.join(', ')}`}.
            </p>
          )}
        </div>

        <div className="mt-6">
          <JobInfo job={job} />
        </div>

        <div className="mt-6 border-t pt-4">
          <ApplyBox job={job} onApplied={(status) => setJob({ ...job, myApplicationStatus: status })} />
        </div>
      </div>
    </div>
  )
}

export default JobDetails
