import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bell, Bot, Briefcase, CalendarDays, CircleCheck, ClipboardCheck, FileText, Lightbulb, MessageSquare, Sparkles } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { getProfileCompletion } from '../../utils/profile'
import StatCard from '../../components/StatCard'
import AnnouncementsPanel from '../../components/AnnouncementsPanel'
import ResumeInsights from '../../components/student/ResumeInsights'

const cards = [
  { to: '/student/jobs', icon: Briefcase, title: 'Job Listings', text: 'Browse open jobs and check if you are eligible.' },
  { to: '/student/applications', icon: FileText, title: 'My Applications', text: 'Track the status of every application.' },
  { to: '/student/drives', icon: CalendarDays, title: 'Placement Drives', text: 'Upcoming campus drives and their schedule.' },
  { to: '/student/mock-tests', icon: ClipboardCheck, title: 'Mock Tests', text: 'Timed aptitude, technical and coding practice tests.' },
  { to: '/student/interviews', icon: Bot, title: 'AI Mock Interview', text: 'Practise interview questions and get AI feedback.' },
  { to: '/student/interview-prep', icon: Lightbulb, title: 'Interview Prep', text: 'AI tips and common questions for your target role.' },
  { to: '/student/assistant', icon: MessageSquare, title: 'AI Assistant', text: 'Ask about your resume, eligible jobs and test scores.' },
]

const StudentDashboard = () => {
  const { user } = useAuth()
  const completion = getProfileCompletion(user)
  const analysis = user.studentProfile?.aiResumeAnalysis
  const [counts, setCounts] = useState(null)

  // Three small requests at the same time; each tile shows "-" if its request fails
  useEffect(() => {
    Promise.allSettled([api.get('/jobs'), api.get('/applications/me'), api.get('/notifications')]).then(([jobs, apps, notes]) => {
      setCounts({
        jobs: jobs.status === 'fulfilled' ? jobs.value.data.count : '-',
        shortlisted:
          apps.status === 'fulfilled'
            ? apps.value.data.applications.filter((a) => ['shortlisted', 'interview', 'selected'].includes(a.status)).length
            : '-',
        alerts: notes.status === 'fulfilled' ? notes.value.data.unreadCount : '-',
      })
    })
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
        <p className="mt-1 text-slate-500">{completion.percent === 100 ? 'Profile complete' : `Profile ${completion.percent}% complete`}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard icon={Briefcase} label="Open jobs" value={counts?.jobs ?? '…'} to="/student/jobs" />
        <StatCard icon={Sparkles} tone="green" label="Resume score" value={analysis?.score ?? '-'} to="/student/profile" />
        <StatCard icon={CircleCheck} tone="orange" label="Shortlisted" value={counts?.shortlisted ?? '…'} to="/student/applications" />
        <StatCard icon={Bell} tone="cyan" label="Unread alerts" value={counts?.alerts ?? '…'} />
      </div>

      {completion.percent < 100 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Complete Your Profile</h2>
              <p className="mt-1 text-sm text-blue-100">Missing: {completion.missing.join(', ')}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 w-48 rounded-full bg-white/25">
                  <div className="h-2 rounded-full bg-white" style={{ width: `${completion.percent}%` }} />
                </div>
                <span className="text-sm font-semibold">{completion.percent}%</span>
              </div>
            </div>
            <Link to="/student/profile" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
              Complete Profile
            </Link>
          </div>
        </div>
      )}

      {analysis?.score != null ? (
        <ResumeInsights
          analysis={analysis}
          action={
            <Link to="/student/profile" className="text-sm font-semibold text-blue-600 hover:underline">
              Re-analyze on profile &rarr;
            </Link>
          }
        />
      ) : (
        <Link to="/student/profile" className="card flex items-center gap-4 p-5 transition hover:border-blue-200 hover:shadow-md">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Sparkles size={22} />
          </span>
          <div className="flex-1">
            <h2 className="font-semibold">AI Resume Insights</h2>
            <p className="text-sm text-slate-500">Upload your resume and let the AI score it out of 100.</p>
          </div>
          <ArrowRight size={18} className="text-slate-400" />
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ to, icon: Icon, title, text }) => (
          <Link key={to} to={to} className="card group p-5 transition hover:border-blue-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon size={22} />
              </span>
              <ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
            </div>
            <h2 className="mt-4 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{text}</p>
          </Link>
        ))}
      </div>

      <AnnouncementsPanel />
    </div>
  )
}

export default StudentDashboard
