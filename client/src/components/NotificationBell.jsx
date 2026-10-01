import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import api from '../services/api'
import { formatDate } from '../utils/format'

const REFRESH_SECONDS = 60

// Bell in the header with the unread count and a dropdown list
const NotificationBell = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const boxRef = useRef(null)

  const load = () => {
    api
      .get('/notifications')
      .then((res) => {
        setNotifications(res.data.notifications)
        setUnreadCount(res.data.unreadCount)
      })
      .catch(() => {}) // a failed refresh is not worth an error popup
  }

  // Load now, then every 60 seconds, so new notifications appear without a page refresh
  useEffect(() => {
    load()
    const timer = setInterval(load, REFRESH_SECONDS * 1000)
    return () => clearInterval(timer)
  }, [])

  // Close the dropdown when clicking anywhere outside it
  useEffect(() => {
    const handleClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const openNotification = async (n) => {
    setOpen(false)
    if (!n.isRead) {
      setNotifications(notifications.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)))
      setUnreadCount((c) => Math.max(0, c - 1))
      api.patch(`/notifications/${n._id}/read`).catch(() => {})
    }
    if (n.link) navigate(n.link)
  }

  const markAllRead = async () => {
    setNotifications(notifications.map((x) => ({ ...x, isRead: true })))
    setUnreadCount(0)
    api.patch('/notifications/read-all').catch(() => {})
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => openNotification(n)}
                  className={`block w-full border-b px-4 py-3 text-left last:border-0 hover:bg-gray-50 ${n.isRead ? '' : 'bg-blue-50'}`}
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-gray-600">{n.message}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{formatDate(n.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
