import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import { TEST_CATEGORIES } from '../../utils/constants'
import { formatDate } from '../../utils/format'
import Tabs from '../../components/Tabs'
import Spinner from '../../components/Spinner'

const TABS = [{ value: 'all', label: 'All' }, ...TEST_CATEGORIES.map((c) => ({ value: c, label: c }))]

const MockTests = () => {
  const navigate = useNavigate()
  const [tests, setTests] = useState([])
  const [attempts, setAttempts] = useState([])
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/mock-tests'), api.get('/mock-tests/attempts/me')])
      .then(([testsRes, attemptsRes]) => {
        setTests(testsRes.data.tests)
        setAttempts(attemptsRes.data.attempts)
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [])

  const startTest = (test) => {
    const ok = window.confirm(`"${test.title}" has ${test.questionCount} questions and a ${test.duration}-minute timer. The timer starts now and keeps running even if you close the page. Start?`)
    if (ok) navigate(`/student/mock-tests/${test._id}/take`)
  }

  if (loading) return <Spinner />

  const visible = category === 'all' ? tests : tests.filter((t) => t.category === category)

  return (
    <div className="mx-auto max-w-5xl">
      <p className="mb-4 mt-1 text-gray-500">Practise for placement tests. You can take each test as many times as you like.</p>

      <Tabs tabs={TABS} active={category} onChange={setCategory} />

      {visible.length === 0 ? (
        <div className="mt-6 card p-8 text-center text-gray-500">No tests available yet.</div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {visible.map((t) => (
            <div key={t._id} className="flex flex-col card p-5">
              <span className="w-fit rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">{t.category}</span>
              <h2 className="mt-2 font-semibold">{t.title}</h2>
              {t.description && <p className="mt-1 text-sm text-gray-600">{t.description}</p>}
              <p className="mt-2 text-sm text-gray-500">
                {t.questionCount} questions &middot; {t.totalPoints} points &middot; {t.duration} min
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {t.myAttempts > 0 ? `Your best: ${t.myBestPercentage}% (${t.myAttempts} attempt${t.myAttempts === 1 ? '' : 's'})` : 'Not attempted yet'}
              </p>
              <button onClick={() => startTest(t)} className="mt-4 w-fit rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700">
                {t.myAttempts > 0 ? 'Take again' : 'Start test'}
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-10 text-lg font-semibold">My attempts</h2>
      {attempts.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">Your results will appear here.</p>
      ) : (
        <div className="mt-3 overflow-x-auto card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Test</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {attempts.map((a) => (
                <tr key={a._id} className="border-b last:border-0">
                  <td className="px-4 py-3">{a.test?.title || 'Deleted test'}</td>
                  <td className="px-4 py-3">{formatDate(a.completedAt)}</td>
                  <td className="px-4 py-3">
                    {a.score}/{a.totalPoints} ({a.percentage}%){a.timedOut && <span className="ml-1 text-xs text-red-600">time over</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/student/mock-tests/attempts/${a._id}`} className="text-blue-600 hover:underline">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default MockTests
