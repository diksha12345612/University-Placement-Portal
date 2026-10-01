import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import { formatDate, todayInputValue } from '../../utils/format'
import Input from '../../components/Input'
import Button from '../../components/Button'
import Spinner from '../../components/Spinner'
import ListSection from '../../components/ListSection'

const EMPTY_FORM = { title: '', company: '', date: '', venue: '', eligibility: '', description: '', status: 'upcoming', schedule: [] }
const SCHEDULE_FIELDS = [
  { name: 'time', label: 'Time', required: true, placeholder: '10:00 AM' },
  { name: 'activity', label: 'Activity', required: true, placeholder: 'Aptitude test' },
]
const STATUS_STYLES = {
  upcoming: 'bg-blue-100 text-blue-800',
  ongoing: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-200 text-gray-700',
}

// Saved drive -> form values (the date is stored as midnight India time, which is the previous day in UTC)
const toForm = (drive) => ({
  title: drive.title,
  company: drive.company,
  date: new Date(drive.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }), // en-CA gives YYYY-MM-DD
  venue: drive.venue,
  eligibility: drive.eligibility || '',
  description: drive.description || '',
  status: drive.status,
  schedule: drive.schedule.map((s) => ({ time: s.time, activity: s.activity })),
})

const ManageDrives = () => {
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState('') // '' = creating a new drive
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadDrives = () =>
    api
      .get('/admin/drives')
      .then((res) => setDrives(res.data.drives))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false))

  useEffect(() => {
    loadDrives()
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const startCreate = () => {
    setEditingId('')
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const startEdit = (drive) => {
    setEditingId(drive._id)
    setForm(toForm(drive))
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.company.trim() || !form.date || !form.venue.trim()) {
      return toast.error('Title, company, date and venue are required')
    }
    if (form.schedule.some((s) => !s.time.trim() || !s.activity.trim())) {
      return toast.error('Every schedule row needs a time and an activity')
    }

    setSaving(true)
    try {
      const res = editingId ? await api.put(`/admin/drives/${editingId}`, form) : await api.post('/admin/drives', form)
      toast.success(res.data.message)
      setShowForm(false)
      loadDrives()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (drive) => {
    if (!window.confirm(`Delete "${drive.title}"?`)) return
    try {
      const res = await api.delete(`/admin/drives/${drive._id}`)
      toast.success(res.data.message)
      setDrives(drives.filter((d) => d._id !== drive._id))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mt-1 text-gray-500">Students are notified when you create a drive.</p>
        </div>
        {!showForm && <Button onClick={startCreate}>+ New drive</Button>}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 card p-5" noValidate>
          <h2 className="font-semibold">{editingId ? 'Edit drive' : 'New drive'}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Title" id="title" name="title" placeholder="e.g. Campus Recruitment Drive 2026" value={form.title} onChange={handleChange} />
            <Input label="Company" id="company" name="company" value={form.company} onChange={handleChange} />
            <Input label="Date" id="date" name="date" type="date" min={editingId ? undefined : todayInputValue()} value={form.date} onChange={handleChange} />
            <Input label="Venue" id="venue" name="venue" placeholder="e.g. Main Auditorium" value={form.venue} onChange={handleChange} />
            <Input label="Eligibility (optional)" id="eligibility" name="eligibility" placeholder="e.g. CSE, IT with CGPA 7+" value={form.eligibility} onChange={handleChange} />
            <div>
              <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select id="status" name="status" value={form.status} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
              Description (optional)
            </label>
            <textarea id="description" name="description" rows={3} maxLength={3000} value={form.description} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Schedule (optional)</p>
            <ListSection items={form.schedule} fields={SCHEDULE_FIELDS} emptyItem={{ time: '', activity: '' }} onChange={(schedule) => setForm({ ...form, schedule })} addLabel="Add schedule row" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={saving}>
              {editingId ? 'Save changes' : 'Create drive'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <Spinner />
      ) : drives.length === 0 ? (
        <div className="mt-6 card p-8 text-center text-gray-500">No drives yet.</div>
      ) : (
        <div className="mt-6 space-y-4">
          {drives.map((d) => (
            <div key={d._id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{d.title}</h2>
                  <p className="text-sm text-gray-600">
                    {d.company} &middot; {formatDate(d.date)} &middot; {d.venue}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[d.status]}`}>{d.status}</span>
              </div>
              <div className="mt-3 flex gap-3 text-sm">
                <button onClick={() => startEdit(d)} className="text-blue-600 hover:underline">
                  Edit
                </button>
                <button onClick={() => handleDelete(d)} className="text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ManageDrives
