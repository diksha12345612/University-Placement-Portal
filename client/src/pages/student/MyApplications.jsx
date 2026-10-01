import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import { formatDate } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'

const MyApplications = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    api
      .get('/applications/me')
      .then((res) => setApplications(res.data.applications))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [])

  const withdraw = async (application) => {
    if (!window.confirm(`Withdraw your application for "${application.job.title}"?`)) return

    setBusyId(application._id)
    try {
      const res = await api.delete(`/applications/${application._id}`)
      toast.success(res.data.message)
      setApplications(applications.filter((a) => a._id !== application._id))
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusyId('')
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="mx-auto max-w-4xl">
      <p className="mt-1 text-gray-500">Track every job you have applied to.</p>

      {applications.length === 0 ? (
        <div className="mt-6 card p-8 text-center text-gray-500">
          You have not applied to any jobs yet.{' '}
          <Link to="/student/jobs" className="text-blue-600 hover:underline">
            Browse jobs
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {applications.map((app) => (
            <div key={app._id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{app.job?.title || 'Job removed'}</h2>
                  <p className="text-sm text-gray-600">
                    {app.job?.company} &middot; {app.job?.location} &middot; Applied on {formatDate(app.createdAt)}
                  </p>
                </div>
                <StatusBadge status={app.status} />
              </div>

              {/* Timeline of status changes */}
              <ol className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600">
                {app.statusHistory.map((step, index) => (
                  <li key={index} className="flex items-center gap-2">
                    {index > 0 && <span className="text-gray-300">&rarr;</span>}
                    <span>
                      <span className="font-medium capitalize">{step.status}</span> ({formatDate(step.changedAt)})
                    </span>
                  </li>
                ))}
              </ol>

              {app.status === 'selected' && (
                <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                  Congratulations! The placement office will contact you with the next steps.
                </p>
              )}

              {app.status === 'applied' && (
                <button
                  onClick={() => withdraw(app)}
                  disabled={busyId === app._id}
                  className="mt-4 text-sm text-red-600 hover:underline disabled:opacity-50"
                >
                  Withdraw application
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyApplications
