import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import Logo from './Logo'

const HIGHLIGHTS = [
  'Apply to jobs you are eligible for, in one click',
  'Track every application from applied to selected',
  'Practise with mock tests and an AI interviewer',
]

// Layout for login, register, OTP and password pages. Same dark navy look as the landing page hero:
// info on the left (large screens only) and the form inside a white card on the right.
const AuthCard = ({ title, subtitle, children, footer }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b24] text-white">
      {/* soft blue glows in the background */}
      <div className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-blue-600/30 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 -top-40 h-[480px] w-[620px] rounded-full bg-indigo-500/25 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/">
          <Logo light />
        </Link>
        <Link to="/" className="text-sm font-semibold text-white/80 hover:text-white">
          &larr; Back to home
        </Link>
      </header>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-4 sm:px-6 lg:min-h-[calc(100vh-88px)] lg:grid-cols-[1.1fr_1fr] lg:pb-10">
        <div className="hidden lg:block">
          <h2 className="text-5xl font-extrabold leading-[1.08] tracking-tight">
            Your campus placements,
            <br />
            <span className="bg-gradient-to-r from-blue-200 via-sky-200 to-indigo-200 bg-clip-text text-transparent">all in one place.</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((text) => (
              <li key={text} className="flex items-start gap-3 text-lg text-blue-100/85">
                <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-cyan-300" />
                {text}
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-blue-200/60">For students, recruiters and the Training &amp; Placement Office.</p>
        </div>

        <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 text-slate-900 shadow-2xl shadow-blue-950/40 sm:p-8 lg:mx-0 lg:ml-auto">
          <h1 className="text-center text-2xl font-bold sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-center text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

export default AuthCard
