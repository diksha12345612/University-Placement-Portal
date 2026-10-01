import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import { formatDate } from '../../utils/format'
import { openResume } from '../../utils/resume'
import Tabs from '../../components/Tabs'
import Spinner from '../../components/Spinner'
import StatusBadge from '../../components/StatusBadge'
import Button from '../../components/Button'

const STATUSES = ['applied', 'shortlisted', 'interview', 'selected', 'rejected']
const SETTABLE = ['shortlisted', 'interview', 'selected', 'rejected']

// One applicant card with the status dropdown and private notes
const ApplicantCard = ({ application, jobSkills, onUpdated }) => {
  const student = application.student
  const p = student.studentProfile || {}
  const [status, setStatus] = useState(application.status)
  const [notes, setNotes] = useState(application.notes || '')
  const [saving, setSaving] = useState(false)
  const [ai, setAi] = useState(application.aiEvaluation?.matchScore != null ? application.aiEvaluation : null)
  const [aiLoading, setAiLoading] = useState(false)

  const runAi = async () => {
    setAiLoading(true)
    try {
      const res = await api.post(`/recruiter/applications/${application._id}/ai-evaluate`)
      setAi(res.data.aiEvaluation)
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 6000 })
    } finally {
      setAiLoading(false)
    }
  }

  const mySkills = (p.skills || []).map((s) => s.toLowerCase())
  const matchedSkills = jobSkills.filter((s) => mySkills.includes(s.toLowerCase()))

  const save = async () => {
    const body = {}
    if (status !== application.status) body.status = status
    if (notes !== (application.notes || '')) body.notes = notes
    if (Object.keys(body).length === 0) return toast('Nothing changed')

    if (body.status === 'selected' && !window.confirm(`Mark ${student.name} as SELECTED? They will be counted as placed.`)) return

    setSaving(true)
    try {
      const res = await api.patch(`/recruiter/applications/${application._id}`, body)
      toast.success(res.data.message)
      onUpdated(res.data.application)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const facts = [
    { label: 'Department', value: p.department },
    { label: 'Batch', value: p.batch },
    { label: 'CGPA', value: p.cgpa },
    { label: '10th', value: p.tenthPercentage != null ? `${p.tenthPercentage}%` : null },
    { label: '12th', value: p.twelfthPercentage != null ? `${p.twelfthPercentage}%` : null },
    { label: 'Roll no.', value: p.rollNumber },
  ]

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{student.name}</h2>
          <p className="text-sm text-gray-600">
            {student.email}
            {p.phone && <> &middot; {p.phone}</>}
          </p>
          <p className="text-xs text-gray-400">Applied on {formatDate(application.createdAt)}</p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-sm sm:grid-cols-6">
        {facts.map((f) => (
          <div key={f.label} className="rounded-lg bg-gray-50 p-2">
            <p className="text-xs text-gray-500">{f.label}</p>
            <p className="font-medium">{f.value ?? '-'}</p>
          </div>
        ))}
      </div>

      {p.skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.skills.map((skill) => (
            <span
              key={skill}
              className={`rounded-full px-2.5 py-0.5 text-xs ${
                matchedSkills.some((m) => m.toLowerCase() === skill.toLowerCase()) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {skill}
            </span>
          ))}
        </div>
      )}
      {jobSkills.length > 0 && (
        <p className="mt-1 text-xs text-gray-500">
          Matches {matchedSkills.length} of {jobSkills.length} preferred skills (green)
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <button onClick={() => openResume(`/recruiter/applications/${application._id}/resume`)} className="font-medium text-blue-600 hover:underline">
          View resume
        </button>
        {p.linkedIn && (
          <a href={p.linkedIn} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
            LinkedIn
          </a>
        )}
        {p.github && (
          <a href={p.github} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
            GitHub
          </a>
        )}
        {p.projects?.length > 0 && <span className="text-gray-500">{p.projects.length} project(s)</span>}
      </div>

      {application.coverLetter && (
        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
          <p className="mb-1 text-xs font-medium text-gray-500">Cover letter</p>
          <p className="whitespace-pre-line text-gray-700">{application.coverLetter}</p>
        </div>
      )}

      {/* AI match score: advice for the recruiter, not a decision */}
      <div className="mt-3 rounded-lg border border-gray-200 p-3 text-sm">
        {ai ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">AI match: {ai.matchScore}/100</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  ai.recommendation === 'Strong fit' ? 'bg-green-100 text-green-800' : ai.recommendation === 'Not a fit' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {ai.recommendation}
              </span>
              <button onClick={runAi} disabled={aiLoading} className="ml-auto text-xs text-blue-600 hover:underline disabled:opacity-50">
                {aiLoading ? 'Checking...' : 'Re-check'}
              </button>
            </div>
            <p className="mt-1 text-gray-700">{ai.strengthSummary}</p>
            <p className="mt-1 text-xs text-gray-400">AI suggestion only. Please review the profile yourself.</p>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-gray-500">Get an AI match score based on this job and the candidate&apos;s skills.</span>
            <button onClick={runAi} disabled={aiLoading} className="font-medium text-blue-600 hover:underline disabled:opacity-50">
              {aiLoading ? 'AI is checking (up to a minute)...' : 'Get AI match score'}
            </button>
          </div>
        )}
      </div>

      {/* Status + private notes */}
      <div className="mt-4 grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-[180px_1fr_auto] sm:items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm capitalize">
            {application.status === 'applied' && <option value="applied">applied</option>}
            {SETTABLE.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Private notes (student cannot see)</label>
          <input
            value={notes}
            maxLength={1000}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Good in DSA, ask about project"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
        <Button onClick={save} loading={saving}>
          Save
        </Button>
      </div>
    </div>
  )
}

const Applicants = () => {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [counts, setCounts] = useState({})
  const [tab, setTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get(`/recruiter/jobs/${id}/applications`)
      .then((res) => {
        setJob(res.data.job)
        setApplications(res.data.applications)
        setCounts(res.data.statusCounts)
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  // After saving, replace that application in the list and update the tab counts
  const handleUpdated = (updated) => {
    const old = applications.find((a) => a._id === updated._id)
    if (old.status !== updated.status) {
      setCounts({ ...counts, [old.status]: counts[old.status] - 1, [updated.status]: counts[updated.status] + 1 })
    }
    // the response has the student as an id only, so keep the student details we already have
    setApplications(applications.map((a) => (a._id === updated._id ? { ...updated, student: a.student } : a)))
  }

  if (loading) return <Spinner />
  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-600">{error}</p>
        <Link to="/recruiter/jobs" className="mt-3 inline-block text-blue-600 hover:underline">
          Back to my jobs
        </Link>
      </div>
    )
  }

  const tabs = [
    { value: 'all', label: `All (${applications.length})` },
    ...STATUSES.map((s) => ({ value: s, label: `${s[0].toUpperCase()}${s.slice(1)} (${counts[s] || 0})` })),
  ]
  const visible = tab === 'all' ? applications : applications.filter((a) => a.status === tab)

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/recruiter/jobs" className="text-sm text-blue-600 hover:underline">
        &larr; Back to my jobs
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Applicants: {job.title}</h1>
      <p className="mb-4 mt-1 text-gray-500">
        {job.location} &middot; Deadline {formatDate(job.deadline)}
      </p>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {visible.length === 0 ? (
        <div className="mt-6 card p-8 text-center text-gray-500">No applicants here.</div>
      ) : (
        <div className="mt-6 space-y-4">
          {visible.map((app) => (
            <ApplicantCard key={app._id} application={app} jobSkills={job.eligibility?.skills || []} onUpdated={handleUpdated} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Applicants
