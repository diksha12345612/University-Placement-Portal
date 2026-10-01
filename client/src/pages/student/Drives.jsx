import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import { formatDate } from '../../utils/format'
import Spinner from '../../components/Spinner'

const Drives = () => {
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/drives')
      .then((res) => setDrives(res.data.drives))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div className="mx-auto max-w-4xl">
      <p className="mt-1 text-gray-500">Upcoming campus drives organised by the placement office.</p>

      {drives.length === 0 ? (
        <div className="mt-6 card p-8 text-center text-gray-500">No upcoming drives right now.</div>
      ) : (
        <div className="mt-6 space-y-4">
          {drives.map((d) => (
            <div key={d._id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{d.title}</h2>
                  <p className="text-sm text-gray-600">{d.company}</p>
                </div>
                {d.status === 'ongoing' && (
                  <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Happening now</span>
                )}
              </div>
              <p className="mt-2 text-sm">
                <span className="font-medium">{formatDate(d.date)}</span> &middot; {d.venue}
              </p>
              {d.eligibility && <p className="mt-1 text-sm text-gray-600">Eligibility: {d.eligibility}</p>}
              {d.description && <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{d.description}</p>}
              {d.schedule.length > 0 && (
                <table className="mt-3 text-sm">
                  <tbody>
                    {d.schedule.map((row, i) => (
                      <tr key={i}>
                        <td className="whitespace-nowrap py-0.5 pr-4 font-medium tabular-nums">{row.time}</td>
                        <td className="py-0.5 text-gray-700">{row.activity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Drives
