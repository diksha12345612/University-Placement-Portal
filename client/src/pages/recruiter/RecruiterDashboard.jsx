import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowRight, Briefcase, Clock, PlusCircle, Users, XCircle } from 'lucide-react'
import api, { getErrorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/Spinner'
import StatCard from '../../components/StatCard'
import AnnouncementsPanel from '../../components/AnnouncementsPanel'

const RecruiterDashboard = () => {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/recruiter/jobs')
      .then((res) => setJobs(res.data.jobs))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [])

  const count = (status) => jobs.filter((j) => j.status === status).length
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicantCount || 0), 0)

  const actions = [
    { to: '/recruiter/jobs/new', icon: PlusCircle, title: 'Post a Job', text: 'Create a job with eligibility criteria. It goes live after admin approval.' },
    { to: '/recruiter/jobs', icon: Briefcase, title: 'My Jobs & Applicants', text: 'See approval status, open applicants, shortlist or select.' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
      <p className="mt-1 text-slate-500">{user.recruiterProfile?.companyName}</p>

      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard icon={Briefcase} label="Live jobs" value={jobs.filter((j) => j.status === 'approved' && j.isActive).length} />
          <StatCard icon={Clock} tone="orange" label="Waiting for approval" value={count('pending')} />
          <StatCard icon={XCircle} tone="cyan" label="Rejected" value={count('rejected')} />
          <StatCard icon={Users} tone="green" label="Total applicants" value={totalApplicants} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {actions.map(({ to, icon: Icon, title, text }) => (
          <Link key={title} to={to} className="card group flex items-start gap-4 p-5 transition hover:border-blue-200 hover:shadow-md">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icon size={22} />
            </span>
            <div className="flex-1">
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">{text}</p>
            </div>
            <ArrowRight size={18} className="mt-1 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
          </Link>
        ))}
      </div>

      <AnnouncementsPanel />
    </div>
  )
}

export default RecruiterDashboard
