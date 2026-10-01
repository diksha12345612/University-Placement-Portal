import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Brain, ChevronDown, Lightbulb, MessagesSquare, Settings2, Target } from 'lucide-react'
import api, { getErrorMessage } from '../../services/api'
import Button from '../../components/Button'

const ROLES = ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Analyst', 'QA / Test Engineer']
const TYPES = [
  { value: 'technical', label: 'Technical', icon: Settings2, style: 'border-indigo-300 bg-indigo-50 text-indigo-700' },
  { value: 'behavioral', label: 'Behavioral', icon: Brain, style: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { value: 'hr', label: 'HR / Culture Fit', icon: MessagesSquare, style: 'border-orange-300 bg-orange-50 text-orange-700' },
]

const QuestionItem = ({ index, item }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-slate-200">
      <button onClick={() => setOpen(!open)} className="flex w-full items-start justify-between gap-3 p-4 text-left" aria-expanded={open}>
        <span className="text-sm font-medium">
          <span className="mr-2 text-blue-600">Q{index + 1}.</span>
          {item.question}
        </span>
        <ChevronDown size={18} className={`mt-0.5 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">{item.hint}</p>}
    </div>
  )
}

const InterviewPrep = () => {
  const [role, setRole] = useState(ROLES[0])
  const [customRole, setCustomRole] = useState('')
  const [type, setType] = useState('technical')
  const [prep, setPrep] = useState(null)
  const [loading, setLoading] = useState(false)

  const chosenRole = role === 'Other' ? customRole.trim() : role

  const generate = async () => {
    if (!chosenRole) return toast.error('Please type a role')
    setLoading(true)
    setPrep(null)
    try {
      const res = await api.post('/assistant/interview-prep', { role: chosenRole, type })
      setPrep({ ...res.data.prep, role: chosenRole, type })
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 6000 })
    } finally {
      setLoading(false)
    }
  }

  // The AI interview supports technical and HR; behavioural questions belong to the HR round there
  const interviewType = type === 'technical' ? 'technical' : 'hr'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start gap-4">
        <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-indigo-600 sm:flex">
          <Target size={28} />
        </span>
        <div>
          <h2 className="text-3xl font-bold">AI Interview Prep</h2>
          <p className="mt-1 text-slate-500">Pick a role and a round. The AI prepares tips, topics to revise and commonly asked questions with hints.</p>
        </div>
      </div>

      <div className="card space-y-6 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Target role</span>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium">
              {[...ROLES, 'Other'].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          {role === 'Other' && (
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Type the role</span>
              <input value={customRole} onChange={(e) => setCustomRole(e.target.value)} maxLength={60} placeholder="e.g. DevOps Engineer" className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
            </label>
          )}
        </div>

        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Question type</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {TYPES.map(({ value, label, icon: Icon, style }) => (
              <button
                key={value}
                onClick={() => setType(value)}
                aria-pressed={type === value}
                className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-semibold transition ${type === value ? style : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={generate} loading={loading} className="w-full py-3">
          Generate prep sheet
        </Button>
        {loading && <p className="text-center text-sm text-slate-500">The AI is preparing your sheet. This can take up to a minute...</p>}
      </div>

      {prep && (
        <div className="space-y-6">
          {prep.topics.length > 0 && (
            <div className="card p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Topics to revise for {prep.role}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {prep.topics.map((t) => (
                  <span key={t} className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
            <div className="card p-5 sm:p-6">
              <h3 className="flex items-center gap-2 font-semibold">
                <Lightbulb size={18} className="text-orange-500" /> Tips
              </h3>
              <ul className="mt-3 space-y-3">
                {prep.tips.map((tip, i) => (
                  <li key={tip} className="flex gap-3 text-sm text-slate-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-bold text-orange-600">{i + 1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-5 sm:p-6">
              <h3 className="font-semibold">Common questions</h3>
              <p className="mb-3 text-xs text-slate-500">Think of your own answer first, then open the hint.</p>
              <div className="space-y-2">
                {prep.questions.map((q, i) => (
                  <QuestionItem key={q.question} index={i} item={q} />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div>
              <p className="font-display text-lg font-semibold">Ready to practise out loud?</p>
              <p className="text-sm text-blue-100">Answer 5 questions from the AI interviewer and get feedback on each one.</p>
            </div>
            <Link to={`/student/interviews?role=${encodeURIComponent(prep.role)}&type=${interviewType}`} className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50">
              Start AI mock interview
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default InterviewPrep
