import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import Button from '../../components/Button'
import Spinner from '../../components/Spinner'

// Answers are also kept in the browser, so a page refresh does not lose them.
// localStorage can be blocked (private mode), so every use is wrapped in try/catch.
const storageKey = (attemptId) => `mock-test-answers-${attemptId}`
const loadSavedAnswers = (attemptId) => {
  try {
    return JSON.parse(localStorage.getItem(storageKey(attemptId))) || {}
  } catch {
    return {}
  }
}
const saveAnswers = (attemptId, answers) => {
  try {
    localStorage.setItem(storageKey(attemptId), JSON.stringify(answers))
  } catch {
    // not important: the answers are still in memory
  }
}
const clearAnswers = (attemptId) => {
  try {
    localStorage.removeItem(storageKey(attemptId))
  } catch {
    // ignore
  }
}

const formatTime = (ms) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const TakeTest = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [session, setSession] = useState(null) // { attemptId, endsAt, clockOffset, test }
  const [answers, setAnswers] = useState({})
  const [current, setCurrent] = useState(0)
  const [remaining, setRemaining] = useState(null) // milliseconds left
  const [submitting, setSubmitting] = useState(false)
  const submittedRef = useRef(false) // stops a double submit (button + timer at the same moment)
  const startedRef = useRef(false) // React's StrictMode runs effects twice in development

  // Start the test (or resume an unfinished attempt). The server decides the end time.
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    api
      .post(`/mock-tests/${id}/start`)
      .then((res) => {
        const { attemptId, endsAt, serverTime, test } = res.data
        // If the computer clock is wrong, this offset corrects the timer
        const clockOffset = new Date(serverTime).getTime() - Date.now()
        setSession({ attemptId, endsAt: new Date(endsAt).getTime(), clockOffset, test })
        setAnswers(loadSavedAnswers(attemptId))
        if (res.status === 200) toast('Resuming your unfinished attempt')
      })
      .catch((error) => {
        toast.error(getErrorMessage(error))
        navigate('/student/mock-tests')
      })
  }, [id, navigate])

  const submit = useCallback(
    async (auto = false) => {
      if (!session || submittedRef.current) return
      submittedRef.current = true
      setSubmitting(true)
      try {
        await api.post(`/mock-tests/attempts/${session.attemptId}/submit`, { answers })
        toast.success(auto ? 'Time is up. Your answers were submitted.' : 'Test submitted')
      } catch (error) {
        // e.g. "time was over": the attempt is still closed on the server, so show the result anyway
        toast.error(getErrorMessage(error))
      }
      clearAnswers(session.attemptId)
      navigate(`/student/mock-tests/attempts/${session.attemptId}`, { replace: true })
    },
    [session, answers, navigate],
  )

  // Timer: update every second, auto-submit at 00:00
  useEffect(() => {
    if (!session) return
    const tick = () => {
      const left = session.endsAt - (Date.now() + session.clockOffset)
      setRemaining(left)
      if (left <= 0) submit(true)
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [session, submit])

  // Warn before closing the tab or refreshing during the test
  useEffect(() => {
    const warn = (e) => {
      if (!submittedRef.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  if (!session || remaining === null) return <Spinner />

  const { test } = session
  const question = test.questions[current]
  const answeredCount = test.questions.filter((q) => (answers[q._id] || '').trim() !== '').length

  const setAnswer = (value) => {
    const updated = { ...answers, [question._id]: value }
    setAnswers(updated)
    saveAnswers(session.attemptId, updated)
  }

  const handleSubmitClick = () => {
    const unanswered = test.questions.length - answeredCount
    const message = unanswered > 0 ? `You have ${unanswered} unanswered question(s). Submit anyway?` : 'Submit your answers?'
    if (window.confirm(message)) submit(false)
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Sticky header with the timer */}
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b bg-gray-50/95 px-4 py-3 sm:mx-0">
        <div>
          <h1 className="font-semibold">{test.title}</h1>
          <p className="text-xs text-gray-500">
            {answeredCount} of {test.questions.length} answered
          </p>
        </div>
        <div className={`rounded-lg px-3 py-1.5 font-mono text-lg font-bold tabular-nums ${remaining < 60000 ? 'bg-red-100 text-red-700' : 'bg-white text-gray-900 shadow-sm'}`} aria-live="polite">
          {formatTime(remaining)}
        </div>
      </div>

      {/* Question numbers: click to jump. Blue = answered. */}
      <div className="mt-4 flex flex-wrap gap-2">
        {test.questions.map((q, i) => {
          const answered = (answers[q._id] || '').trim() !== ''
          return (
            <button
              key={q._id}
              onClick={() => setCurrent(i)}
              className={`h-9 w-9 rounded-lg text-sm font-medium ${i === current ? 'ring-2 ring-blue-600 ring-offset-1' : ''} ${answered ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 shadow-sm'}`}
              aria-label={`Question ${i + 1}${answered ? ', answered' : ''}`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      <div className="mt-4 card p-6">
        <p className="text-xs text-gray-500">
          Question {current + 1} of {test.questions.length} &middot; {question.points} point{question.points === 1 ? '' : 's'}
        </p>
        <p className="mt-2 whitespace-pre-line font-medium">{question.question}</p>

        {question.type === 'mcq' ? (
          <div className="mt-4 space-y-2">
            {question.options.map((option) => (
              <label
                key={option}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${answers[question._id] === option ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <input type="radio" name={question._id} checked={answers[question._id] === option} onChange={() => setAnswer(option)} />
                {option}
              </label>
            ))}
            {answers[question._id] && (
              <button onClick={() => setAnswer('')} className="text-xs text-gray-500 hover:underline">
                Clear answer
              </button>
            )}
          </div>
        ) : (
          <input
            value={answers[question._id] || ''}
            onChange={(e) => setAnswer(e.target.value)}
            maxLength={500}
            placeholder="Type your answer"
            className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button variant="secondary" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
            Previous
          </Button>
          {current < test.questions.length - 1 ? (
            <Button onClick={() => setCurrent(current + 1)}>Next</Button>
          ) : (
            <Button onClick={handleSubmitClick} loading={submitting}>
              Submit test
            </Button>
          )}
        </div>
      </div>

      {current < test.questions.length - 1 && (
        <div className="mt-4 text-right">
          <Button variant="secondary" onClick={handleSubmitClick} loading={submitting}>
            Submit test now
          </Button>
        </div>
      )}
    </div>
  )
}

export default TakeTest
