import { useState } from 'react'
import toast from 'react-hot-toast'
import { DEPARTMENTS, JOB_TYPES } from '../../utils/constants'
import { todayInputValue } from '../../utils/format'
import Input from '../Input'
import Button from '../Button'
import SkillsInput from '../SkillsInput'

// Saved job (or nothing, for a new job) -> plain strings for the inputs
const toForm = (job) => ({
  title: job?.title || '',
  type: job?.type || 'Full-time',
  location: job?.location || '',
  salary: job?.salary || '',
  openings: job?.openings ?? 1,
  // The backend stores the deadline as 23:59 India time, which is still the same date in UTC
  deadline: job?.deadline ? String(job.deadline).slice(0, 10) : '',
  description: job?.description || '',
  requirementsText: (job?.requirements || []).join('\n'),
  minCGPA: job?.eligibility?.minCGPA || '',
  batch: job?.eligibility?.batch ?? '',
  branches: job?.eligibility?.branches || [],
  skills: job?.eligibility?.skills || [],
})

const textareaClass =
  'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'

// Used for both "Post a job" and "Edit job". The parent page does the API call in onSubmit.
const JobForm = ({ initialJob, onSubmit, submitting, submitLabel }) => {
  const [form, setForm] = useState(() => toForm(initialJob))
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const toggleBranch = (branch) => {
    const branches = form.branches.includes(branch)
      ? form.branches.filter((b) => b !== branch)
      : [...form.branches, branch]
    setForm({ ...form, branches })
  }

  const validate = () => {
    const newErrors = {}
    if (!form.title.trim()) newErrors.title = 'Job title is required'
    if (!form.location.trim()) newErrors.location = 'Location is required'
    if (!form.description.trim()) newErrors.description = 'Job description is required'
    if (!form.deadline) newErrors.deadline = 'Deadline is required'
    else if (form.deadline < todayInputValue()) newErrors.deadline = 'Deadline cannot be in the past'
    if (!Number.isInteger(Number(form.openings)) || Number(form.openings) < 1) {
      newErrors.openings = 'Must be a whole number, at least 1'
    }
    if (form.minCGPA !== '' && (Number(form.minCGPA) < 0 || Number(form.minCGPA) > 10)) {
      newErrors.minCGPA = 'Must be between 0 and 10'
    }
    if (form.batch !== '' && !/^\d{4}$/.test(String(form.batch))) newErrors.batch = 'Enter a year like 2026'

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the highlighted fields')
      return false
    }
    return true
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    onSubmit({
      title: form.title.trim(),
      type: form.type,
      location: form.location.trim(),
      salary: form.salary.trim(),
      openings: Number(form.openings),
      deadline: form.deadline,
      description: form.description.trim(),
      // one requirement per line
      requirements: form.requirementsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      eligibility: {
        minCGPA: form.minCGPA,
        batch: form.batch,
        branches: form.branches,
        skills: form.skills,
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="card p-5">
        <h2 className="mb-4 font-semibold">Job details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Job title" id="title" name="title" placeholder="e.g. Software Engineer Intern" value={form.title} onChange={handleChange} error={errors.title} />
          </div>
          <div>
            <label htmlFor="type" className="mb-1 block text-sm font-medium text-gray-700">
              Job type
            </label>
            <select id="type" name="type" value={form.type} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <Input label="Location" id="location" name="location" placeholder="e.g. Pune / Remote" value={form.location} onChange={handleChange} error={errors.location} />
          <Input label="Salary / Stipend (optional)" id="salary" name="salary" placeholder="e.g. 6-8 LPA or 25,000/month" maxLength={50} value={form.salary} onChange={handleChange} />
          <Input label="Openings" id="openings" name="openings" type="number" min="1" value={form.openings} onChange={handleChange} error={errors.openings} />
          <Input label="Application deadline" id="deadline" name="deadline" type="date" min={todayInputValue()} value={form.deadline} onChange={handleChange} error={errors.deadline} />
        </div>

        <div className="mt-4">
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea id="description" name="description" rows={6} maxLength={5000} value={form.description} onChange={handleChange} className={`${textareaClass} ${errors.description ? 'border-red-500' : ''}`} placeholder="What will the candidate do? What does the selection process look like?" />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
        </div>

        <div className="mt-4">
          <label htmlFor="requirementsText" className="mb-1 block text-sm font-medium text-gray-700">
            Requirements (optional, one per line)
          </label>
          <textarea id="requirementsText" name="requirementsText" rows={4} value={form.requirementsText} onChange={handleChange} className={textareaClass} placeholder={'Good knowledge of data structures\nNo active backlogs'} />
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold">Eligibility</h2>
        <p className="mb-4 text-sm text-gray-500">Students who do not meet these rules cannot apply. Leave empty for no rule.</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Minimum CGPA" id="minCGPA" name="minCGPA" type="number" step="0.1" min="0" max="10" placeholder="e.g. 7" value={form.minCGPA} onChange={handleChange} error={errors.minCGPA} />
          <Input label="Batch (passing-out year)" id="batch" name="batch" type="number" placeholder="e.g. 2026" value={form.batch} onChange={handleChange} error={errors.batch} />
        </div>

        <p className="mb-2 mt-4 text-sm font-medium text-gray-700">Branches (none selected = all branches)</p>
        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.map((d) => (
            <label
              key={d.value}
              className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                form.branches.includes(d.value) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-gray-600'
              }`}
            >
              <input type="checkbox" className="sr-only" checked={form.branches.includes(d.value)} onChange={() => toggleBranch(d.value)} />
              {d.value}
            </label>
          ))}
        </div>

        <p className="mb-2 mt-4 text-sm font-medium text-gray-700">Preferred skills (optional)</p>
        <SkillsInput skills={form.skills} onChange={(skills) => setForm({ ...form, skills })} />
      </div>

      <Button type="submit" loading={submitting} className="w-full sm:w-auto">
        {submitLabel}
      </Button>
    </form>
  )
}

export default JobForm
