import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  BadgeCheck,
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Megaphone,
  MessageSquare,
  Menu,
  PlusCircle,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import Logo from './Logo'

// Sidebar links for each role, grouped into titled sections.
// end: true = highlight only on that exact path ("My Jobs" should not light up on "/recruiter/jobs/new")
const NAV = {
  student: [
    {
      title: 'Navigation',
      links: [
        { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/student/profile', label: 'My Profile', icon: UserRound },
        { to: '/student/jobs', label: 'Job Listings', icon: Briefcase },
        { to: '/student/applications', label: 'My Applications', icon: FileText },
        { to: '/student/drives', label: 'Placement Drives', icon: CalendarDays },
        { to: '/student/assistant', label: 'AI Assistant', icon: MessageSquare },
      ],
    },
    {
      title: 'Prep Resources',
      links: [
        { to: '/student/mock-tests', label: 'Mock Tests', icon: ClipboardCheck },
        { to: '/student/interviews', label: 'AI Mock Interview', icon: Bot },
        { to: '/student/interview-prep', label: 'Interview Prep', icon: Lightbulb },
      ],
    },
  ],
  recruiter: [
    {
      title: 'Navigation',
      links: [
        { to: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/recruiter/jobs', label: 'My Jobs', icon: Briefcase, end: true },
        { to: '/recruiter/jobs/new', label: 'Post a Job', icon: PlusCircle },
      ],
    },
  ],
  admin: [
    {
      title: 'Navigation',
      links: [{ to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Management',
      links: [
        { to: '/admin/students', label: 'Students', icon: GraduationCap },
        { to: '/admin/recruiters', label: 'Recruiters', icon: Building2 },
        { to: '/admin/jobs', label: 'Job Approvals', icon: BadgeCheck },
      ],
    },
    {
      title: 'Placement Office',
      links: [
        { to: '/admin/drives', label: 'Placement Drives', icon: CalendarDays },
        { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
        { to: '/admin/mock-tests', label: 'Mock Tests', icon: ClipboardCheck },
      ],
    },
  ],
}

const ROLE_LABELS = { student: 'Student', recruiter: 'Recruiter', admin: 'Placement Officer' }

// Title shown in the header: the sidebar link that matches the current URL best
const getPageTitle = (pathname, sections, role) => {
  const links = sections.flatMap((section) => section.links)
  const match = links
    .filter((link) => pathname === link.to || pathname.startsWith(link.to + '/'))
    .sort((a, b) => b.to.length - a.to.length)[0]
  if (!match) return ''
  if (match.label !== 'Dashboard') return match.label
  return role === 'admin' ? 'Admin Dashboard' : `${ROLE_LABELS[role]} Dashboard`
}

// "Diksha Pal" -> "DP"
const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

const DashboardLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false) // used on small screens only

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const sections = NAV[user.role] || []
  const pageTitle = getPageTitle(pathname, sections, user.role)

  return (
    <div className="min-h-screen">
      {/* Sidebar: fixed on large screens, slides in on mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
          <div>
            <Logo />
            <p className="mt-2 pl-[46px] text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">{ROLE_LABELS[user.role]}</p>
          </div>
          <button className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-6">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{section.title}</p>
              <div className="space-y-0.5">
                {section.links.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                        isActive ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon size={18} strokeWidth={2} />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Dark background behind the open sidebar on mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="lg:pl-64">
        {/* Glass header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <button
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <h1 className="ml-3 truncate font-display text-lg font-semibold lg:ml-0">{pageTitle}</h1>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-1 sm:pr-4">
              {user.studentProfile?.photoUrl ? (
                <img src={user.studentProfile.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                  {initials(user.name)}
                </span>
              )}
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-[11px] text-slate-500">{ROLE_LABELS[user.role]}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
