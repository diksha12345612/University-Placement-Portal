import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import { formatDate, isPast, todayInputValue } from '../../utils/format'
import Input from '../../components/Input'
import Button from '../../components/Button'
import Spinner from '../../components/Spinner'

const EMPTY_FORM = { title: '', content: '', priority: 'normal', targetAudience: 'all', expiresAt: '' }
const AUDIENCE_LABELS = { all: 'Everyone', students: 'Students', recruiters: 'Recruiters' }
const selectClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm'

const ManageAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () =>
    api
      .get('/admin/announcements')
      .then((res) => setAnnouncements(res.data.announcements))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const startEdit = (a) => {
    setEditingId(a._id)
    setForm({
      title: a.title,
      content: a.content,
      priority: a.priority,
      targetAudience: a.targetAudience,
      expiresAt: a.expiresAt ? new Date(a.expiresAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId('')
    setForm(EMPTY_FORM)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return toast.error('Title and content are required')

    setSaving(true)
    try {
      const res = editingId ? await api.put(`/admin/announcements/${editingId}`, form) : await api.post('/admin/announcements', form)
      toast.success(res.data.message)
      cancelEdit()
      load()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (a) => {
    if (!window.confirm(`Delete "${a.title}"?`)) return
    try {
      const res = await api.delete(`/admin/announcements/${a._id}`)
      toast.success(res.data.message)
      setAnnouncements(announcements.filter((x) => x._id !== a._id))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <p className="mt-1 text-gray-500">Shown on the dashboard of the selected audience until the expiry date.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 card p-5" noValidate>
        <h2 className="font-semibold">{editingId ? 'Edit announcement' : 'New announcement'}</h2>
        <Input label="Title" id="title" name="title" maxLength={150} value={form.title} onChange={handleChange} />
        <div>
          <label htmlFor="content" className="mb-1 block text-sm font-medium text-gray-700">
            Message
          </label>
          <textarea id="content" name="content" rows={4} maxLength={3000} value={form.content} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="targetAudience" className="mb-1 block text-sm font-medium text-gray-700">
              Audience
            </label>
            <select id="targetAudience" name="targetAudience" value={form.targetAudience} onChange={handleChange} className={selectClass}>
              <option value="all">Everyone</option>
              <option value="students">Students only</option>
              <option value="recruiters">Recruiters only</option>
            </select>
          </div>
          <div>
            <label htmlFor="priority" className="mb-1 block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select id="priority" name="priority" value={form.priority} onChange={handleChange} className={selectClass}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High (highlighted)</option>
            </select>
          </div>
          <Input label="Expires on (optional)" id="expiresAt" name="expiresAt" type="date" min={editingId ? undefined : todayInputValue()} value={form.expiresAt} onChange={handleChange} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" loading={saving}>
            {editingId ? 'Save changes' : 'Post announcement'}
          </Button>
          {editingId && (
            <Button type="button" variant="secondary" onClick={cancelEdit}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      {loading ? (
        <Spinner />
      ) : announcements.length === 0 ? (
        <div className="mt-6 card p-8 text-center text-gray-500">No announcements yet.</div>
      ) : (
        <div className="mt-6 space-y-4">
          {announcements.map((a) => {
            const expired = a.expiresAt && isPast(a.expiresAt)
            return (
              <div key={a._id} className={`card p-5 ${expired ? 'opacity-60' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-semibold">{a.title}</h2>
                  <div className="flex gap-2 text-xs">
                    {a.priority === 'high' && <span className="rounded-full bg-red-100 px-2.5 py-0.5 font-medium text-red-800">High priority</span>}
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-gray-700">{AUDIENCE_LABELS[a.targetAudience]}</span>
                    {expired && <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-gray-700">Expired</span>}
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{a.content}</p>
                <p className="mt-2 text-xs text-gray-500">
                  Posted {formatDate(a.createdAt)}
                  {a.expiresAt && <> &middot; {expired ? 'Expired' : 'Expires'} {formatDate(a.expiresAt)}</>}
                </p>
                <div className="mt-3 flex gap-3 text-sm">
                  <button onClick={() => startEdit(a)} className="text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(a)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ManageAnnouncements
