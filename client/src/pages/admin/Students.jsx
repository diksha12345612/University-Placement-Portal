import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import { DEPARTMENTS } from '../../utils/constants'
import Spinner from '../../components/Spinner'

const selectClass = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm'

const Students = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [filters, setFilters] = useState({ search: '', department: '', batch: '', placed: '' })

  useEffect(() => {
    // send only the filters that have a value
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    api
      .get('/admin/students', { params })
      .then((res) => setStudents(res.data.students))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [filters])

  const setFilter = (name, value) => {
    setLoading(true)
    setFilters({ ...filters, [name]: value })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setFilter('search', searchText.trim())
  }

  return (
    <div>
      <p className="mb-4 mt-1 text-gray-500">Search and filter all registered students.</p>

      <div className="flex flex-col gap-3 card p-4 lg:flex-row lg:items-center">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Name, email or roll number"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
          <button type="submit" className="rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">
            Search
          </button>
        </form>
        <select value={filters.department} onChange={(e) => setFilter('department', e.target.value)} className={selectClass}>
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.value}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Batch"
          value={filters.batch}
          onChange={(e) => setFilter('batch', e.target.value)}
          className={`${selectClass} w-28`}
        />
        <select value={filters.placed} onChange={(e) => setFilter('placed', e.target.value)} className={selectClass}>
          <option value="">Placed and not placed</option>
          <option value="true">Placed</option>
          <option value="false">Not placed</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : students.length === 0 ? (
        <div className="mt-6 card p-8 text-center text-gray-500">No students found.</div>
      ) : (
        <div className="mt-6 overflow-x-auto card">
          <p className="px-4 pt-3 text-sm text-gray-500">{students.length} student(s)</p>
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Roll no.</th>
                <th className="px-4 py-3 font-medium">Dept</th>
                <th className="px-4 py-3 font-medium">Batch</th>
                <th className="px-4 py-3 font-medium">CGPA</th>
                <th className="px-4 py-3 font-medium">Placement</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {students.map((s) => {
                const p = s.studentProfile || {}
                return (
                  <tr key={s._id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/admin/students/${s._id}`} className="font-medium text-blue-600 hover:underline">
                        {s.name}
                      </Link>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </td>
                    <td className="px-4 py-3">{p.rollNumber || '-'}</td>
                    <td className="px-4 py-3">{p.department || '-'}</td>
                    <td className="px-4 py-3">{p.batch || '-'}</td>
                    <td className="px-4 py-3">{p.cgpa ?? '-'}</td>
                    <td className="px-4 py-3">
                      {p.isPlaced ? (
                        <span className="text-green-700">Placed at {p.placedAt}</span>
                      ) : (
                        <span className="text-gray-500">Not placed</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Students
