import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import { formatDate } from '../../utils/format'
import Tabs from '../../components/Tabs'
import Spinner from '../../components/Spinner'
import StatusBadge from '../../components/StatusBadge'
import JobInfo from '../../components/JobInfo'
import Button from '../../components/Button'

const TABS = [
  { value: 'pending', label: 'Waiting for approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const ManageJobs = () => {
  const [tab, setTab] = useState('pending')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState('') // job whose details are expanded
  const [rejectingId, setRejectingId] = useState('') // job whose reject box is open
  const [reason, setReason] = useState('')
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    api
      .get(`/admin/jobs?status=${tab}`)
      .then((res) => setJobs(res.data.jobs))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [tab])

  const changeTab = (value) => {
    setLoading(true)
    setTab(value)
  }

  const review = async (job, status) => {
    if (status === 'rejected' && !reason.trim()) return toast.error('Please write a reason for rejecting')

    setBusyId(job._id)
    try {
      const res = await api.patch(`/admin/jobs/${job._id}/review`, { status, rejectionReason: reason.trim() })
      toast.success(res.data.message)
      setJobs(jobs.filter((j) => j._id !== job._id)) // it moved to another tab
      setRejectingId('')
      setReason('')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusyId('')
    }
  }

  return (
    <div>
      <p className="mb-4 mt-1 text-gray-500">Students only see jobs that you approve.</p>

      <Tabs tabs={TABS} active={tab} onChange={changeTab} />

      {loading ? (
        <Spinner />
      ) : jobs.length === 0 ? (
        <div className="mt-6 card p-8 text-center text-gray-500">No jobs here.</div>
      ) : (
        <div className="mt-6 space-y-4">
          {jobs.map((job) => (
            <div key={job._id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{job.title}</h2>
                  <p className="text-sm text-gray-500">
                    {job.company} &middot; posted by {job.postedBy?.name} ({job.postedBy?.email}) on {formatDate(job.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={job.status} />
                  {!job.isActive && <StatusBadge status="closed" />}
                </div>
              </div>

              {job.status === 'rejected' && <p className="mt-2 text-sm text-red-700">Reason: {job.rejectionReason}</p>}

              <button onClick={() => setOpenId(openId === job._id ? '' : job._id)} className="mt-3 text-sm text-blue-600 hover:underline">
                {openId === job._id ? 'Hide details' : 'View details'}
              </button>
              {openId === job._id && (
                <div className="mt-4 border-t pt-4">
                  <JobInfo job={job} />
                </div>
              )}

              {rejectingId === job._id ? (
                <div className="mt-4 rounded-lg bg-red-50 p-3">
                  <label htmlFor={`reason-${job._id}`} className="mb-1 block text-sm font-medium text-red-800">
                    Reason for rejecting (the recruiter will see this)
                  </label>
                  <textarea
                    id={`reason-${job._id}`}
                    rows={2}
                    maxLength={300}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <div className="mt-2 flex gap-2">
                    <Button variant="danger" loading={busyId === job._id} onClick={() => review(job, 'rejected')}>
                      Confirm reject
                    </Button>
                    <Button variant="secondary" onClick={() => setRejectingId('')}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {job.status !== 'approved' && (
                    <button
                      onClick={() => review(job, 'approved')}
                      disabled={busyId === job._id}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  {job.status !== 'rejected' && (
                    <button
                      onClick={() => {
                        setRejectingId(job._id)
                        setReason('')
                      }}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                    >
                      Reject
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ManageJobs
