import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import { formatDate } from '../../utils/format'
import Button from '../../components/Button'
import Spinner from '../../components/Spinner'

const ROLE_IDEAS = ['Software Developer', 'Frontend Developer', 'Backend Developer', 'Data Analyst', 'Full Stack Developer']
const selectClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm'

const MockInterviews = () => {
  const navigate = useNavigate()
  // The Interview Prep page links here with ?role=...&type=... to fill the form
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState(() => ({
    role: (searchParams.get('role') || '').slice(0, 60),
    interviewType: searchParams.get('type') === 'hr' ? 'hr' : 'technical',
    difficulty: 'medium',
  }))
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    api
      .get('/interviews')
      .then((res) => setInterviews(res.data.interviews))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleStart = async (e) => {
    e.preventDefault()
    if (!form.role.trim()) return toast.error('Please enter a job role')

    setStarting(true)
    try {
      const res = await api.post('/interviews', { ...form, role: form.role.trim() })
      navigate(`/student/interviews/${res.data.interview._id}`)
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 6000 })
      setStarting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mt-1 text-gray-500">Answer 5 questions from an AI interviewer and get feedback on every answer.</p>

      <form onSubmit={handleStart} className="mt-6 space-y-4 card p-5">
        <label className="block text-sm font-medium text-gray-700">
          Job role
          <input
            name="role"
            value={form.role}
            onChange={handleChange}
            maxLength={60}
            list="role-ideas"
            placeholder="e.g. Frontend Developer"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
          <datalist id="role-ideas">
            {ROLE_IDEAS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm font-medium text-gray-700">
            Type
            <select name="interviewType" value={form.interviewType} onChange={handleChange} className={selectClass}>
              <option value="technical">Technical</option>
              <option value="hr">HR / Behavioural</option>
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">
            Difficulty
            <select name="difficulty" value={form.difficulty} onChange={handleChange} className={selectClass}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        </div>
        <Button type="submit" loading={starting}>
          Start interview
        </Button>
        {starting && <p className="text-sm text-gray-500">The AI is preparing your first question...</p>}
      </form>

      <h2 className="mt-10 text-lg font-semibold">My interviews</h2>
      {loading ? (
        <Spinner />
      ) : interviews.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">Your past interviews will appear here.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {interviews.map((iv) => (
            <Link key={iv._id} to={`/student/interviews/${iv._id}`} className="flex items-center justify-between card p-4 transition hover:border-blue-200 hover:shadow-md">
              <div>
                <p className="font-medium">{iv.role}</p>
                <p className="text-sm capitalize text-gray-500">
                  {iv.interviewType === 'hr' ? 'HR' : 'Technical'} &middot; {iv.difficulty} &middot; {formatDate(iv.createdAt)}
                </p>
              </div>
              {iv.status === 'completed' ? (
                <span className="text-lg font-bold tabular-nums">{iv.result?.overallScore}/100</span>
              ) : (
                <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Continue</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default MockInterviews
