import { useEffect, useState } from 'react'
import api from '../services/api'
import { formatDate } from '../utils/format'

// Announcements for the logged-in user's role. The backend decides which ones they may see.
const AnnouncementsPanel = () => {
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    api
      .get('/announcements')
      .then((res) => setAnnouncements(res.data.announcements))
      .catch(() => {}) // the dashboard still works without announcements
  }, [])

  if (announcements.length === 0) return null

  return (
    <div className="mt-6 card p-5">
      <h2 className="font-semibold">Announcements</h2>
      <ul className="mt-3 space-y-3">
        {announcements.map((a) => (
          <li key={a._id} className={`rounded-lg p-3 text-sm ${a.priority === 'high' ? 'border border-red-200 bg-red-50' : 'bg-gray-50'}`}>
            <p className="font-medium">
              {a.priority === 'high' && <span className="mr-2 text-xs font-semibold uppercase text-red-700">Important</span>}
              {a.title}
            </p>
            <p className="mt-1 whitespace-pre-line text-gray-700">{a.content}</p>
            <p className="mt-1 text-xs text-gray-500">{formatDate(a.createdAt)}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AnnouncementsPanel
