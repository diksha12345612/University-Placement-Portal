import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import Spinner from '../../components/Spinner'

const ManageMockTests = () => {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    api
      .get('/admin/mock-tests')
      .then((res) => setTests(res.data.tests))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [])

  const togglePublish = async (test) => {
    setBusyId(test._id)
    try {
      const res = await api.patch(`/admin/mock-tests/${test._id}/publish`, { isPublished: !test.isPublished })
      toast.success(res.data.message)
      setTests(tests.map((t) => (t._id === test._id ? { ...t, isPublished: !t.isPublished } : t)))
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusyId('')
    }
  }

  const handleDelete = async (test) => {
    if (!window.confirm(`Delete "${test.title}" and all ${test.attempts} student attempt(s)? This cannot be undone.`)) return
    setBusyId(test._id)
    try {
      const res = await api.delete(`/admin/mock-tests/${test._id}`)
      toast.success(res.data.message)
      setTests(tests.filter((t) => t._id !== test._id))
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusyId('')
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mt-1 text-gray-500">Students see only published tests.</p>
        </div>
        <Link to="/admin/mock-tests/new" className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700">
          + New test
        </Link>
      </div>

      {tests.length === 0 ? (
        <div className="mt-6 card p-8 text-center text-gray-500">
          No tests yet. Create one, or run <code className="rounded bg-gray-100 px-1">npm run seed:tests</code> in the server folder for sample tests.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Test</th>
                <th className="px-4 py-3 font-medium">Questions</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Attempts</th>
                <th className="px-4 py-3 font-medium">Avg score</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {tests.map((t) => (
                <tr key={t._id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-gray-500">{t.category}</p>
                  </td>
                  <td className="px-4 py-3">
                    {t.questionCount} ({t.totalPoints} pts)
                  </td>
                  <td className="px-4 py-3">{t.duration} min</td>
                  <td className="px-4 py-3">{t.attempts}</td>
                  <td className="px-4 py-3">{t.averagePercentage == null ? '-' : `${t.averagePercentage}%`}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${t.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                      {t.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => togglePublish(t)} disabled={busyId === t._id} className="text-blue-600 hover:underline disabled:opacity-50">
                        {t.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <Link to={`/admin/mock-tests/${t._id}/edit`} className="text-blue-600 hover:underline">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(t)} disabled={busyId === t._id} className="text-red-600 hover:underline disabled:opacity-50">
                        Delete
                      </button>
                    </div>
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

export default ManageMockTests
