import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react'
import Logo from '../components/Logo'
import LoginForm from '../components/LoginForm'

const FEATURES = [
  { icon: Briefcase, title: 'Eligibility-checked jobs', text: 'Students only apply where they meet the CGPA, branch and batch rules, checked on the server.' },
  { icon: Bell, title: 'Live application tracking', text: 'Applied, shortlisted, interview, selected: every change sends the student a notification.' },
  { icon: FileSearch, title: 'AI resume review', text: 'A score, strengths, missing skills and practical tips for every uploaded resume.' },
  { icon: Bot, title: 'AI mock interview', text: 'Five role-based questions with feedback on each answer and a final report.' },
  { icon: ClipboardCheck, title: 'Timed mock tests', text: 'Aptitude, technical and coding tests with a server-side timer and answer review.' },
  { icon: BarChart3, title: 'Placement analytics', text: 'Placement rate, department-wise and company-wise charts for the placement office.' },
]

const ROLES = [
  {
    icon: GraduationCap,
    title: 'Students',
    points: ['Build a profile and upload a resume', 'See which jobs you are eligible for', 'Prepare with tests and AI interviews'],
  },
  {
    icon: Building2,
    title: 'Recruiters',
    points: ['Post jobs with eligibility rules', 'Review applicants and their resumes', 'Shortlist with an AI match score'],
  },
  {
    icon: ShieldCheck,
    title: 'Placement Office',
    points: ['Approve recruiters and job posts', 'Schedule drives and post announcements', 'Track placements with live charts'],
  },
]

const STEPS = [
  { title: 'Register', text: 'Sign up as a student or recruiter and verify your email with an OTP.' },
  { title: 'Get approved', text: 'The placement office approves recruiters and every job before students see it.' },
  { title: 'Apply & review', text: 'Students apply in one click; recruiters shortlist, interview and select.' },
  { title: 'Get placed', text: 'Selections update placement records and analytics automatically.' },
]

const TECH = ['React', 'Vite', 'Tailwind CSS', 'Node.js', 'Express', 'MongoDB', 'JWT Auth', 'Cloudinary', 'Nodemailer', 'OpenAI-compatible AI']

// Card on the right of the hero: Sign In form, or the two ways to register
const HeroAuthCard = () => {
  const [tab, setTab] = useState('signin')

  return (
    <div className="w-full rounded-3xl bg-white p-6 text-slate-900 shadow-2xl shadow-blue-950/40 sm:p-8">
      <div className="grid grid-cols-2 border-b border-slate-200">
        {[
          { value: 'signin', label: 'Sign In' },
          { value: 'register', label: 'Register' },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`-mb-px border-b-2 pb-3 font-display text-lg font-semibold transition ${
              tab === t.value ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'signin' ? (
        <div className="mt-6">
          <h2 className="text-center text-2xl font-bold">Welcome Back</h2>
          <p className="mb-6 mt-1 text-center text-sm text-slate-500">Sign in to access your placement portal</p>
          <LoginForm />
        </div>
      ) : (
        <div className="mt-6">
          <h2 className="text-center text-2xl font-bold">Create your account</h2>
          <p className="mb-6 mt-1 text-center text-sm text-slate-500">Choose how you want to join</p>
          <div className="space-y-3">
            <Link to="/register?role=student" className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/50">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <GraduationCap size={22} />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">I am a Student</span>
                <span className="text-sm text-slate-500">Build your profile and apply to jobs</span>
              </span>
              <ArrowRight size={18} className="text-slate-400" />
            </Link>
            <Link to="/register?role=recruiter" className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/50">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Building2 size={22} />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">I am a Recruiter</span>
                <span className="text-sm text-slate-500">Post jobs after placement office approval</span>
              </span>
              <ArrowRight size={18} className="text-slate-400" />
            </Link>
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">Placement office accounts are created by the administrator.</p>
        </div>
      )}
    </div>
  )
}

const SectionTitle = ({ eyebrow, title, text }) => (
  <div className="mx-auto max-w-2xl text-center">
    <p className="text-sm font-semibold uppercase tracking-[0.15em] text-blue-600">{eyebrow}</p>
    <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h2>
    {text && <p className="mt-4 text-slate-600">{text}</p>}
  </div>
)

// Sample numbers for the landing page (showcase only, not read from the database).
// To show live numbers instead, call GET /api/public/stats like the admin dashboard does.
const HERO_STATS = [
  { label: 'Students', value: '1,200+' },
  { label: 'Students placed', value: '850+' },
  { label: 'Companies', value: '120+' },
  { label: 'Placement rate', value: '92%' },
]

const Landing = () => {
  return (
    <div className="overflow-x-hidden">
      {/* Hero: dark navy with blue glows, sign-in card on the right */}
      <section className="relative overflow-hidden bg-[#070b24] text-white">
        <div className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-blue-600/30 blur-[120px]" />
        <div className="pointer-events-none absolute -right-20 -top-40 h-[480px] w-[620px] rounded-full bg-indigo-500/25 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />

        {/* Navbar */}
        <header className="relative z-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
            <Logo light />
            <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-sm md:flex">
              <a href="#top" className="rounded-full bg-white/15 px-4 py-1.5 font-medium">Home</a>
              <a href="#features" className="rounded-full px-4 py-1.5 text-white/80 hover:text-white">Features</a>
              <a href="#how" className="rounded-full px-4 py-1.5 text-white/80 hover:text-white">How It Works</a>
              <a href="#roles" className="rounded-full px-4 py-1.5 text-white/80 hover:text-white">Who It&apos;s For</a>
            </nav>
            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-white/90 hover:text-white sm:inline-block">
                Login
              </Link>
              <Link to="/register" className="whitespace-nowrap rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                Get Started
              </Link>
            </div>
          </div>
        </header>

        <div id="top" className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pb-28 lg:pt-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/90">
              <GraduationCap size={16} /> University Placement &amp; Preparation Portal
            </span>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Your Gateway to
              <br />
              <span className="bg-gradient-to-r from-blue-200 via-sky-200 to-indigo-200 bg-clip-text text-transparent">Campus Placements</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-blue-100/80">
              One platform connecting students, recruiters and the placement office, with eligibility-checked applications, live status updates and AI-powered preparation.
            </p>

            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              {HERO_STATS.map((s) => (
                <div key={s.label} className="flex flex-col-reverse">
                  <dt className="text-sm text-blue-100/70">{s.label}</dt>
                  <dd className="font-display text-3xl font-bold tabular-nums">{s.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500">
                Start Your Journey <ArrowRight size={18} />
              </Link>
              <a href="#features" className="rounded-xl px-6 py-3.5 font-semibold text-white hover:bg-white/10">
                Explore Features
              </a>
            </div>
          </div>

          <HeroAuthCard />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="Features" title="Everything the placement season needs" text="A complete suite that takes the process from registration to selection." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon size={22} />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle eyebrow="Who it's for" title="Built for every role in the process" text="Students, recruiters and the placement office each get their own dashboard." />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {ROLES.map(({ icon: Icon, title, points }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                  <Icon size={22} />
                </span>
                <h3 className="mt-4 text-xl font-semibold">{title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-blue-600" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="How it works" title="From sign-up to selection in four steps" />
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="card p-6">
              <span className="font-display text-sm font-bold text-blue-600">Step {i + 1}</span>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Tech stack */}
      <section className="border-y border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-sm font-medium text-slate-500">Built with the MERN stack</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            {TECH.map((t) => (
              <span key={t} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm text-slate-700">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-14 text-center text-white sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative text-3xl font-bold sm:text-4xl">Ready to make placements easier?</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-blue-100">Create your account in a minute. Recruiters can start posting jobs as soon as the placement office approves them.</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="rounded-xl bg-white px-6 py-3 font-semibold text-blue-700 hover:bg-blue-50">
              Create an account
            </Link>
            <Link to="/login" className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
          <Logo />
          <p>University Placement &amp; Preparation Portal &middot; Final-year MERN project</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
