import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import Button from '../../components/Button'
import Spinner from '../../components/Spinner'

const MAX_ANSWER = 2000

const InterviewSession = () => {
  const { id } = useParams()
  const [interview, setInterview] = useState(null)
  const [error, setError] = useState('')
  const [answer, setAnswer] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    api
      .get(`/interviews/${id}`)
      .then((res) => setInterview(res.data.interview))
      .catch((err) => setError(getErrorMessage(err)))
  }, [id])

  // Scroll to the newest message, like a chat app
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [interview?.messages.length, sending])

  const sendAnswer = async (e) => {
    e.preventDefault()
    if (!answer.trim()) return toast.error('Please type your answer')

    setSending(true)
    try {
      const res = await api.post(`/interviews/${id}/answer`, { answer: answer.trim() })
      setInterview(res.data.interview)
      setAnswer('')
    } catch (err) {
      // the answer stays in the box, so nothing is lost; the student can press Send again
      toast.error(getErrorMessage(err), { duration: 6000 })
    } finally {
      setSending(false)
    }
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-600">{error}</p>
        <Link to="/student/interviews" className="mt-3 inline-block text-blue-600 hover:underline">
          Back to interviews
        </Link>
      </div>
    )
  }
  if (!interview) return <Spinner />

  const answered = interview.messages.filter((m) => m.sender === 'candidate').length
  const done = interview.status === 'completed'
  const questionNumber = Math.min(answered + 1, interview.totalQuestions)

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/student/interviews" className="text-sm text-blue-600 hover:underline">
        &larr; Back to interviews
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{interview.role}</h1>
          <p className="text-sm capitalize text-gray-500">
            {interview.interviewType === 'hr' ? 'HR' : 'Technical'} interview &middot; {interview.difficulty}
          </p>
        </div>
        <p className="text-sm text-gray-600">{done ? 'Finished' : `Question ${questionNumber} of ${interview.totalQuestions}`}</p>
      </div>

      {/* Conversation */}
      <div className="mt-6 space-y-4">
        {interview.messages.map((m, i) =>
          m.sender === 'interviewer' ? (
            <div key={i} className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-blue-700">Interviewer</p>
              <p className="mt-1 whitespace-pre-line text-sm">{m.content}</p>
            </div>
          ) : (
            <div key={i} className="ml-auto max-w-[85%]">
              <div className="rounded-2xl rounded-tr-sm bg-blue-600 p-4 text-white">
                <p className="text-xs font-medium text-blue-100">You</p>
                <p className="mt-1 whitespace-pre-line text-sm">{m.content}</p>
              </div>
              {m.feedback && (
                <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
                  <p className="text-xs font-medium text-gray-500">Feedback &middot; {m.score}/10</p>
                  <p className="mt-0.5 text-gray-700">{m.feedback}</p>
                </div>
              )}
            </div>
          ),
        )}
        {sending && <p className="text-sm text-gray-500">The interviewer is thinking...</p>}
        <div ref={bottomRef} />
      </div>

      {done ? (
        <div className="mt-8 card p-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">Overall score</p>
            <p className="mt-1 text-5xl font-bold tabular-nums">{interview.result.overallScore}</p>
            <p className="text-sm text-gray-500">out of 100</p>
          </div>
          <p className="mt-4 text-sm text-gray-700">{interview.result.summary}</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-green-700">What went well</h3>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-gray-700">
                {interview.result.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-700">What to improve</h3>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-gray-700">
                {interview.result.improvements.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
          <Link to="/student/interviews" className="mt-6 inline-block rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700">
            Start another interview
          </Link>
        </div>
      ) : (
        <form onSubmit={sendAnswer} className="sticky bottom-0 mt-6 rounded-xl border bg-white p-4 shadow-sm">
          <textarea
            rows={4}
            value={answer}
            maxLength={MAX_ANSWER}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={sending}
            placeholder="Type your answer as you would say it in an interview..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-50"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400 tabular-nums">
              {answer.length}/{MAX_ANSWER}
            </span>
            <Button type="submit" loading={sending}>
              Send answer
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export default InterviewSession
