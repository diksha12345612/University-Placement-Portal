import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Clock, IndianRupee, MapPin, Search, Users } from 'lucide-react'
import api, { getErrorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { JOB_TYPES } from '../../utils/constants'
import { daysLeft, formatDate } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'

const MAX_SKILL_CHIPS = 3

// One job card: title, company, four facts with icons, skill chips, rules and buttons
const JobCard = ({ job }) => {
  const left = daysLeft(job.deadline)
  const skills = job.eligibility?.skills || []
  const minCGPA = job.eligibility?.minCGPA
  const canApply = job.eligibilityCheck.isEligible && !job.myApplicationStatus

  const facts = [
    { icon: MapPin, text: job.location },
    { icon: Clock, text: job.type },
    { icon: IndianRupee, text: job.salary || 'Not mentioned' },
    { icon: Users, text: `${job.openings} opening${job.openings === 1 ? '' : 's'}` },
  ]

  return (
    <div className="card flex flex-col p-5 transition hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold leading-snug">{job.title}</h2>
        {/* Once applied, show the application status instead of eligibility */}
        <StatusBadge status={job.myApplicationStatus || (job.eligibilityCheck.isEligible ? 'eligible' : 'not eligible')} />
      </div>
      <p className="mt-1 font-medium text-blue-600">{job.company}</p>

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-sm text-slate-600">
        {facts.map(({ icon: Icon, text }) => (
          <span key={text} className="flex min-w-0 items-center gap-1.5">
            <Icon size={15} className="shrink-0 text-slate-400" />
            <span className="truncate">{text}</span>
          </span>
        ))}
      </div>

      {skills.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {skills.slice(0, MAX_SKILL_CHIPS).map((s) => (
            <span key={s} className="rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-indigo-700">
              {s}
            </span>
          ))}
          {skills.length > MAX_SKILL_CHIPS && <span className="text-xs text-slate-400">+{skills.length - MAX_SKILL_CHIPS} more</span>}
        </div>
      )}

      {/* push the footer to the bottom so all cards in a row line up */}
      <div className="mt-auto pt-4">
        <div className="border-t border-slate-200 pt-3 text-xs text-slate-500">
          CGPA: {minCGPA > 0 ? `${minCGPA}+` : 'Any'} &bull; Deadline: {formatDate(job.deadline)}
          <span className={left <= 2 ? 'font-semibold text-red-600' : ''}> ({left === 0 ? 'closes today' : `${left}d left`})</span>
        </div>
        <div className="mt-3 flex gap-2">
          <Link
            to={`/student/jobs/${job._id}`}
            className={`flex-1 rounded-xl py-2 text-center text-sm font-semibold transition ${
              canApply
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/20 hover:from-blue-600 hover:to-blue-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {job.myApplicationStatus ? 'Applied' : canApply ? 'Apply' : 'Not eligible'}
          </Link>
          <Link to={`/student/jobs/${job._id}`} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Details
          </Link>
        </div>
      </div>
    </div>
  )
}

const Jobs = () => {
  const { user } = useAuth()
  const profile = user.studentProfile || {}

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('') // what is typed in the box
  const [search, setSearch] = useState('') // what we actually searched for
  const [type, setType] = useState('')
  const [onlyEligible, setOnlyEligible] = useState(false)

  // Fetch again whenever the search or type filter changes
  useEffect(() => {
    const params = {}
    if (search) params.search = search
    if (type) params.type = type

    api
      .get('/jobs', { params })
      .then((res) => setJobs(res.data.jobs))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [search, type])

  const handleSearch = (e) => {
    e.preventDefault()
    setLoading(true)
    setSearch(searchText.trim())
  }

  const handleTypeChange = (e) => {
    setLoading(true)
    setType(e.target.value)
  }

  // "Only eligible" is filtered here in the browser; the server already sent eligibility for each job
  const visibleJobs = onlyEligible ? jobs.filter((job) => job.eligibilityCheck.isEligible) : jobs
  const profileIncomplete = profile.cgpa == null || !profile.department || !profile.batch

  return (
    <div className="space-y-5">
      <p className="text-slate-500">Campus jobs approved by the placement office.</p>

      {profileIncomplete && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
          Add your CGPA, department and batch in{' '}
          <Link to="/student/profile" className="font-semibold underline">
            My Profile
          </Link>{' '}
          so we can check which jobs you are eligible for.
        </div>
      )}

      <div className="card flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by title, company or location"
              aria-label="Search jobs"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
          <button type="submit" className="rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
            Search
          </button>
        </form>
        <select value={type} onChange={handleTypeChange} aria-label="Job type" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <option value="">All types</option>
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={onlyEligible} onChange={(e) => setOnlyEligible(e.target.checked)} className="h-4 w-4 accent-blue-600" />
          Only jobs I&apos;m eligible for
        </label>
      </div>

      {loading ? (
        <Spinner />
      ) : visibleJobs.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">No jobs found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleJobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Jobs
