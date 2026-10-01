import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../../services/api'
import { formatDate } from '../../utils/format'
import { openResume } from '../../utils/resume'
import Spinner from '../../components/Spinner'
import StatusBadge from '../../components/StatusBadge'

const Section = ({ title, children }) => (
  <div className="card p-5">
    <h2 className="mb-3 font-semibold">{title}</h2>
    {children}
  </div>
)

const StudentDetail = () => {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get(`/admin/students/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
  }, [id])

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-600">{error}</p>
        <Link to="/admin/students" className="mt-3 inline-block text-blue-600 hover:underline">
          Back to students
        </Link>
      </div>
    )
  }
  if (!data) return <Spinner />

  const { student, applications } = data
  const p = student.studentProfile || {}

  const facts = [
    { label: 'Roll number', value: p.rollNumber },
    { label: 'Department', value: p.department },
    { label: 'Batch', value: p.batch },
    { label: 'CGPA', value: p.cgpa },
    { label: '10th', value: p.tenthPercentage != null ? `${p.tenthPercentage}%` : null },
    { label: '12th', value: p.twelfthPercentage != null ? `${p.twelfthPercentage}%` : null },
    { label: 'Phone', value: p.phone },
    { label: 'Email verified', value: student.isVerified ? 'Yes' : 'No' },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link to="/admin/students" className="text-sm text-blue-600 hover:underline">
          &larr; Back to students
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <p className="text-gray-600">{student.email}</p>
          </div>
          {p.isPlaced ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">Placed at {p.placedAt}</span>
          ) : (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">Not placed</span>
          )}
        </div>
      </div>

      <Section title="Profile">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">{f.label}</p>
              <p className="font-medium">{f.value ?? '-'}</p>
            </div>
          ))}
        </div>
        {p.skills?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {p.skills.map((s) => (
              <span key={s} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700">
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {p.resumePublicId ? (
            <button onClick={() => openResume(`/admin/students/${student._id}/resume`)} className="font-medium text-blue-600 hover:underline">
              View resume
            </button>
          ) : (
            <span className="text-gray-500">No resume uploaded</span>
          )}
          {p.linkedIn && (
            <a href={p.linkedIn} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
              LinkedIn
            </a>
          )}
          {p.github && (
            <a href={p.github} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
              GitHub
            </a>
          )}
        </div>
      </Section>

      {p.projects?.length > 0 && (
        <Section title="Projects">
          <ul className="space-y-3 text-sm">
            {p.projects.map((pr) => (
              <li key={pr._id}>
                <p className="font-medium">{pr.title}</p>
                {pr.techStack?.length > 0 && <p className="text-xs text-gray-500">{pr.techStack.join(', ')}</p>}
                {pr.description && <p className="text-gray-700">{pr.description}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {p.experience?.length > 0 && (
        <Section title="Experience">
          <ul className="space-y-2 text-sm">
            {p.experience.map((e) => (
              <li key={e._id}>
                <span className="font-medium">{e.role}</span> at {e.company}
                {e.startDate && (
                  <span className="text-gray-500">
                    {' '}
                    ({formatDate(e.startDate)} - {e.endDate ? formatDate(e.endDate) : 'present'})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={`Applications (${applications.length})`}>
        {applications.length === 0 ? (
          <p className="text-sm text-gray-500">No applications yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Job</th>
                  <th className="py-2 pr-4 font-medium">Company</th>
                  <th className="py-2 pr-4 font-medium">Applied on</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a._id} className="border-t">
                    <td className="py-2 pr-4">{a.job?.title}</td>
                    <td className="py-2 pr-4">{a.job?.company}</td>
                    <td className="py-2 pr-4">{formatDate(a.createdAt)}</td>
                    <td className="py-2">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  )
}

export default StudentDetail
