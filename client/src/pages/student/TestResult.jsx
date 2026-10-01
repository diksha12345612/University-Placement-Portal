import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../../services/api'
import { formatDate } from '../../utils/format'
import Spinner from '../../components/Spinner'

const TestResult = () => {
  const { attemptId } = useParams()
  const [attempt, setAttempt] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get(`/mock-tests/attempts/${attemptId}`)
      .then((res) => setAttempt(res.data.attempt))
      .catch((err) => setError(getErrorMessage(err)))
  }, [attemptId])

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-600">{error}</p>
        <Link to="/student/mock-tests" className="mt-3 inline-block text-blue-600 hover:underline">
          Back to mock tests
        </Link>
      </div>
    )
  }
  if (!attempt) return <Spinner />

  const correctCount = attempt.answers.filter((a) => a.isCorrect).length
  const skippedCount = attempt.answers.filter((a) => !a.answer).length

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/student/mock-tests" className="text-sm text-blue-600 hover:underline">
        &larr; Back to mock tests
      </Link>

      <div className="mt-3 card p-6 text-center">
        <p className="text-sm text-gray-500">{attempt.test?.title || 'Deleted test'}</p>
        <p className="mt-2 text-5xl font-bold text-gray-900">{attempt.percentage}%</p>
        <p className="mt-1 text-gray-600">
          {attempt.score} of {attempt.totalPoints} points
        </p>
        <p className="mt-2 text-sm text-gray-500 tabular-nums">
          {correctCount} correct &middot; {attempt.answers.length - correctCount - skippedCount} wrong &middot; {skippedCount} skipped &middot; {formatDate(attempt.completedAt)}
        </p>
        {attempt.timedOut && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">The time ran out before your answers reached the server, so this attempt was scored 0.</p>
        )}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Review answers</h2>
      <div className="mt-3 space-y-4">
        {attempt.answers.map((a, i) => (
          <div key={a.questionId} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">
                {i + 1}. {a.question}
              </p>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${a.isCorrect ? 'bg-green-100 text-green-800' : a.answer ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-700'}`}>
                {a.isCorrect ? `Correct +${a.pointsEarned}` : a.answer ? 'Wrong' : 'Skipped'}
              </span>
            </div>

            {a.type === 'mcq' ? (
              <ul className="mt-3 space-y-1.5 text-sm">
                {a.options.map((option) => {
                  const isCorrectOption = option === a.correctAnswer
                  const isChosen = option === a.answer
                  return (
                    <li
                      key={option}
                      className={`rounded-lg border p-2.5 ${isCorrectOption ? 'border-green-300 bg-green-50' : isChosen ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    >
                      {option}
                      {isCorrectOption && <span className="ml-2 text-xs font-medium text-green-700">Correct answer</span>}
                      {isChosen && !isCorrectOption && <span className="ml-2 text-xs font-medium text-red-700">Your answer</span>}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="mt-3 space-y-1 text-sm">
                <p>
                  Your answer: <span className={a.isCorrect ? 'text-green-700' : 'text-red-700'}>{a.answer || '(skipped)'}</span>
                </p>
                {!a.isCorrect && (
                  <p>
                    Correct answer: <span className="text-green-700">{a.correctAnswer}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TestResult
