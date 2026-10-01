import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import { TEST_CATEGORIES } from '../../utils/constants'
import Input from '../../components/Input'
import Button from '../../components/Button'
import Spinner from '../../components/Spinner'
import QuestionEditor from '../../components/admin/QuestionEditor'

const newQuestion = () => ({ question: '', type: 'mcq', points: 1, options: ['', '', '', ''], correctIndex: 0, shortAnswer: '' })

// Saved question (correct answer as text) -> editor format (correct answer as a position)
const toEditorQuestion = (q) => ({
  question: q.question,
  type: q.type,
  points: q.points,
  options: q.type === 'mcq' ? q.options : ['', '', '', ''],
  correctIndex: q.type === 'mcq' ? Math.max(0, q.options.indexOf(q.correctAnswer)) : 0,
  shortAnswer: q.type === 'short' ? q.correctAnswer : '',
})

// Editor format -> what the API expects
const toApiQuestion = (q) =>
  q.type === 'mcq'
    ? { question: q.question.trim(), type: 'mcq', points: Number(q.points), options: q.options.map((o) => o.trim()), correctAnswer: q.options[q.correctIndex]?.trim() }
    : { question: q.question.trim(), type: 'short', points: Number(q.points), options: [], correctAnswer: q.shortAnswer.trim() }

// One page for /admin/mock-tests/new and /admin/mock-tests/:id/edit
const MockTestEditor = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState({ title: '', category: 'Aptitude', duration: 10, description: '' })
  const [questions, setQuestions] = useState([newQuestion()])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    api
      .get(`/admin/mock-tests/${id}`)
      .then((res) => {
        const t = res.data.test
        setForm({ title: t.title, category: t.category, duration: t.duration, description: t.description || '' })
        setQuestions(t.questions.map(toEditorQuestion))
      })
      .catch((error) => {
        toast.error(getErrorMessage(error))
        navigate('/admin/mock-tests')
      })
      .finally(() => setLoading(false))
  }, [id, isEdit, navigate])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  // Same rules as the backend, with the question number in the message
  const validate = () => {
    if (!form.title.trim()) return 'Title is required'
    const minutes = Number(form.duration)
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) return 'Duration must be 1 to 180 minutes'
    if (questions.length === 0) return 'Add at least one question'
    for (const [i, q] of questions.entries()) {
      const n = i + 1
      if (!q.question.trim()) return `Question ${n}: type the question`
      const points = Number(q.points)
      if (!Number.isInteger(points) || points < 1 || points > 10) return `Question ${n}: points must be 1 to 10`
      if (q.type === 'mcq') {
        if (q.options.some((o) => !o.trim())) return `Question ${n}: fill every option or remove empty ones`
        const lower = q.options.map((o) => o.trim().toLowerCase())
        if (new Set(lower).size !== lower.length) return `Question ${n}: options must be different`
      } else if (!q.shortAnswer.trim()) {
        return `Question ${n}: type the correct answer`
      }
    }
    return ''
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const error = validate()
    if (error) return toast.error(error)

    const payload = { ...form, duration: Number(form.duration), questions: questions.map(toApiQuestion) }
    setSaving(true)
    try {
      const res = isEdit ? await api.put(`/admin/mock-tests/${id}`, payload) : await api.post('/admin/mock-tests', payload)
      toast.success(res.data.message)
      navigate('/admin/mock-tests')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0)

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/mock-tests" className="text-sm text-blue-600 hover:underline">
        &larr; Back to mock tests
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{isEdit ? 'Edit mock test' : 'New mock test'}</h1>
      {isEdit && <p className="mt-1 text-sm text-gray-500">Old results are kept as they were. Changes apply to new attempts.</p>}

      <form onSubmit={handleSave} className="mt-6 space-y-6" noValidate>
        <div className="space-y-4 card p-5">
          <Input label="Title" id="title" name="title" maxLength={150} value={form.title} onChange={handleChange} />
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm font-medium text-gray-700">
              Category
              <select name="category" value={form.category} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                {TEST_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <Input label="Duration (minutes)" id="duration" name="duration" type="number" min="1" max="180" value={form.duration} onChange={handleChange} />
          </div>
          <label className="block text-sm font-medium text-gray-700">
            Description (optional)
            <textarea name="description" rows={2} maxLength={1000} value={form.description} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
          </label>
        </div>

        <div className="space-y-4 card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Questions</h2>
            <span className="text-sm text-gray-500">
              {questions.length} question(s) &middot; {totalPoints} point(s)
            </span>
          </div>
          {questions.map((q, i) => (
            <QuestionEditor
              key={i}
              index={i}
              question={q}
              onChange={(updated) => setQuestions(questions.map((x, j) => (j === i ? updated : x)))}
              onRemove={() => setQuestions(questions.filter((_, j) => j !== i))}
            />
          ))}
          <button type="button" onClick={() => setQuestions([...questions, newQuestion()])} className="w-full rounded-lg border border-dashed border-gray-400 py-2 text-sm text-gray-700 hover:bg-gray-50">
            + Add question
          </button>
        </div>

        <Button type="submit" loading={saving}>
          {isEdit ? 'Save changes' : 'Save as draft'}
        </Button>
      </form>
    </div>
  )
}

export default MockTestEditor
