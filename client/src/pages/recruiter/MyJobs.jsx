import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import { formatDate, isPast } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'

const MyJobs = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    api
      .get('/recruiter/jobs')
      .then((res) => setJobs(res.data.jobs))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [])

  const toggleActive = async (job) => {
    if (job.isActive && !window.confirm(`Close "${job.title}"? Students will no longer be able to apply.`)) return

    setBusyId(job._id)
    try {
      const res = await api.patch(`/recruiter/jobs/${job._id}/active`, { isActive: !job.isActive })
      setJobs(jobs.map((j) => (j._id === job._id ? res.data.job : j)))
      toast.success(res.data.message)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusyId('')
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/recruiter/jobs/new" className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700">
          + Post a job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="mt-6 card p-8 text-center text-gray-500">
          You have not posted any jobs yet.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {jobs.map((job) => {
            const expired = isPast(job.deadline)
            return (
              <div key={job._id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{job.title}</h2>
                    <p className="text-sm text-gray-500">
                      {job.type} &middot; {job.location} &middot; Deadline {formatDate(job.deadline)}
                      {expired && <span className="text-red-600"> (passed)</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge status={job.status} />
                    {!job.isActive && <StatusBadge status="closed" />}
                  </div>
                </div>

                {job.status === 'pending' && (
                  <p className="mt-3 text-sm text-yellow-800">Waiting for the placement office to review this job.</p>
                )}
                {job.status === 'rejected' && (
                  <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                    <b>Rejected:</b> {job.rejectionReason}. Edit the job to send it again.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to={`/recruiter/jobs/${job._id}/applicants`} className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700">
                    Applicants ({job.applicantCount})
                  </Link>
                  <Link to={`/recruiter/jobs/${job._id}/edit`} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm hover:bg-gray-50">
                    Edit
                  </Link>
                  <button
                    onClick={() => toggleActive(job)}
                    disabled={busyId === job._id}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                  >
                    {job.isActive ? 'Close job' : 'Reopen job'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MyJobs
