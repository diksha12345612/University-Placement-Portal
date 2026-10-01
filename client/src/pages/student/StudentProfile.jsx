import { useState } from 'react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { DEPARTMENTS } from '../../utils/constants'
import { getProfileCompletion } from '../../utils/profile'
import Input from '../../components/Input'
import Button from '../../components/Button'
import SkillsInput from '../../components/SkillsInput'
import ListSection from '../../components/ListSection'
import ResumeCard from '../../components/student/ResumeCard'
import AiResumeAnalysis from '../../components/student/AiResumeAnalysis'
import PhotoCard from '../../components/student/PhotoCard'
import LinkedInImport from '../../components/student/LinkedInImport'

const EXPERIENCE_FIELDS = [
  { name: 'company', label: 'Company', required: true },
  { name: 'role', label: 'Role', required: true, placeholder: 'e.g. Web Developer Intern' },
  { name: 'startDate', label: 'Start date', type: 'date' },
  { name: 'endDate', label: 'End date (leave empty if ongoing)', type: 'date' },
  { name: 'description', label: 'What did you work on?', type: 'textarea' },
]
const PROJECT_FIELDS = [
  { name: 'title', label: 'Title', required: true },
  { name: 'techStack', label: 'Tech stack (comma separated)', placeholder: 'React, Node.js, MongoDB' },
  { name: 'link', label: 'Link (GitHub / live)', type: 'url', placeholder: 'https://' },
  { name: 'description', label: 'Description', type: 'textarea' },
]
const CERTIFICATE_FIELDS = [
  { name: 'name', label: 'Certificate name', required: true },
  { name: 'issuer', label: 'Issued by', placeholder: 'e.g. Coursera, NPTEL' },
  { name: 'issueDate', label: 'Issue date', type: 'date' },
  { name: 'url', label: 'Certificate link', type: 'url', placeholder: 'https://' },
]

const EMPTY_EXPERIENCE = { company: '', role: '', startDate: '', endDate: '', description: '' }
const EMPTY_PROJECT = { title: '', techStack: '', link: '', description: '' }
const EMPTY_CERTIFICATE = { name: '', issuer: '', issueDate: '', url: '' }

const URL_REGEX = /^https?:\/\/\S+$/i

// Dates come from the API as "2025-06-01T00:00:00.000Z"; <input type="date"> needs "2025-06-01"
const toDateInput = (date) => (date ? String(date).slice(0, 10) : '')

// Convert the saved user into simple strings for the form inputs
const buildForm = (user) => {
  const p = user.studentProfile || {}
  return {
    name: user.name || '',
    rollNumber: p.rollNumber || '',
    department: p.department || '',
    batch: p.batch ?? '',
    cgpa: p.cgpa ?? '',
    phone: p.phone || '',
    tenthPercentage: p.tenthPercentage ?? '',
    twelfthPercentage: p.twelfthPercentage ?? '',
    linkedIn: p.linkedIn || '',
    github: p.github || '',
    skills: p.skills || [],
    experience: (p.experience || []).map((e) => ({
      company: e.company || '',
      role: e.role || '',
      startDate: toDateInput(e.startDate),
      endDate: toDateInput(e.endDate),
      description: e.description || '',
    })),
    projects: (p.projects || []).map((pr) => ({
      title: pr.title || '',
      techStack: (pr.techStack || []).join(', '),
      link: pr.link || '',
      description: pr.description || '',
    })),
    certificates: (p.certificates || []).map((c) => ({
      name: c.name || '',
      issuer: c.issuer || '',
      issueDate: toDateInput(c.issueDate),
      url: c.url || '',
    })),
  }
}

// Empty strings inside list entries are dropped, so the backend does not get "" for dates
const dropEmpty = (obj) => Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== ''))

const Section = ({ title, children }) => (
  <div className="card p-5">
    <h2 className="mb-4 font-semibold">{title}</h2>
    {children}
  </div>
)

const StudentProfile = () => {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState(() => buildForm(user))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const completion = getProfileCompletion(user)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const setField = (name, value) => setForm({ ...form, [name]: value })

  // Adds the LinkedIn details to the form without removing anything the student already typed.
  // Duplicates (same skill, same company + role, same title) are skipped.
  const mergeLinkedIn = (data) => {
    const has = (list, value) => list.some((item) => item.toLowerCase() === value.toLowerCase())
    const skills = [...form.skills]
    data.skills.forEach((s) => {
      if (!has(skills, s) && skills.length < 30) skills.push(s)
    })

    const experience = [...form.experience]
    data.experience.forEach((e) => {
      if (!experience.some((x) => has([x.company], e.company) && has([x.role], e.role))) experience.push({ ...EMPTY_EXPERIENCE, ...e })
    })

    const projects = [...form.projects]
    data.projects.forEach((p) => {
      if (!projects.some((x) => has([x.title], p.title))) {
        projects.push({ ...EMPTY_PROJECT, title: p.title, description: p.description, techStack: p.techStack.join(', ') })
      }
    })

    const certificates = [...form.certificates]
    data.certificates.forEach((c) => {
      if (!certificates.some((x) => has([x.name], c.name))) certificates.push({ ...EMPTY_CERTIFICATE, ...c })
    })

    setForm({ ...form, skills, experience, projects, certificates, linkedIn: form.linkedIn || data.linkedIn })
  }

  const validate = () => {
    const newErrors = {}
    const inRange = (value, min, max) => value === '' || (Number(value) >= min && Number(value) <= max)

    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (!inRange(form.cgpa, 0, 10)) newErrors.cgpa = 'CGPA must be between 0 and 10'
    if (!inRange(form.tenthPercentage, 0, 100)) newErrors.tenthPercentage = 'Must be between 0 and 100'
    if (!inRange(form.twelfthPercentage, 0, 100)) newErrors.twelfthPercentage = 'Must be between 0 and 100'
    if (form.batch !== '' && !/^\d{4}$/.test(String(form.batch))) newErrors.batch = 'Enter a year like 2026'
    if (form.phone && !/^\d{10}$/.test(form.phone.trim())) newErrors.phone = 'Phone number must be 10 digits'
    if (form.linkedIn && !URL_REGEX.test(form.linkedIn.trim())) newErrors.linkedIn = 'Must start with https://'
    if (form.github && !URL_REGEX.test(form.github.trim())) newErrors.github = 'Must start with https://'

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the highlighted fields')
      return false
    }

    if (form.experience.some((e) => !e.company.trim() || !e.role.trim())) {
      toast.error('Please fill Company and Role in every experience entry')
      return false
    }
    if (form.projects.some((p) => !p.title.trim())) {
      toast.error('Please fill the Title of every project')
      return false
    }
    if (form.certificates.some((c) => !c.name.trim())) {
      toast.error('Please fill the Name of every certificate')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      name: form.name.trim(),
      studentProfile: {
        rollNumber: form.rollNumber.trim(),
        department: form.department,
        batch: form.batch,
        cgpa: form.cgpa,
        phone: form.phone.trim(),
        tenthPercentage: form.tenthPercentage,
        twelfthPercentage: form.twelfthPercentage,
        linkedIn: form.linkedIn.trim(),
        github: form.github.trim(),
        skills: form.skills,
        experience: form.experience.map(dropEmpty),
        projects: form.projects.map((p) =>
          dropEmpty({
            ...p,
            techStack: p.techStack
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          }),
        ),
        certificates: form.certificates.map(dropEmpty),
      },
    }

    setSaving(true)
    try {
      const res = await api.put('/students/profile', payload)
      setUser(res.data.user)
      setForm(buildForm(res.data.user))
      toast.success(res.data.message)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <p className="mt-1 text-gray-500">Recruiters see this information when you apply. Keep it accurate.</p>

      {/* Completion bar */}
      <div className="mt-4 card p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Profile completion</span>
          <span className="font-semibold text-blue-700">{completion.percent}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-gray-200">
          <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${completion.percent}%` }} />
        </div>
        {completion.missing.length > 0 && (
          <p className="mt-2 text-xs text-gray-500">Missing: {completion.missing.join(', ')}</p>
        )}
      </div>

      <div className="mt-6 space-y-6">
        {/* Resume uploads on its own, separate from the Save button */}
        <LinkedInImport onImported={mergeLinkedIn} />
        <PhotoCard />
        <ResumeCard />
        <AiResumeAnalysis />

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <Section title="Basic details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Full name" id="name" name="name" value={form.name} onChange={handleChange} error={errors.name} />
              <Input label="Email" id="email" value={user.email} disabled />
              <Input label="Roll number" id="rollNumber" name="rollNumber" value={form.rollNumber} onChange={handleChange} error={errors.rollNumber} />
              <div>
                <label htmlFor="department" className="mb-1 block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Batch (passing-out year)" id="batch" name="batch" type="number" placeholder="2026" value={form.batch} onChange={handleChange} error={errors.batch} />
              <Input label="Phone" id="phone" name="phone" type="tel" maxLength={10} value={form.phone} onChange={handleChange} error={errors.phone} />
            </div>
          </Section>

          <Section title="Academics">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input label="CGPA (out of 10)" id="cgpa" name="cgpa" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={handleChange} error={errors.cgpa} />
              <Input label="10th percentage" id="tenthPercentage" name="tenthPercentage" type="number" step="0.01" min="0" max="100" value={form.tenthPercentage} onChange={handleChange} error={errors.tenthPercentage} />
              <Input label="12th / Diploma percentage" id="twelfthPercentage" name="twelfthPercentage" type="number" step="0.01" min="0" max="100" value={form.twelfthPercentage} onChange={handleChange} error={errors.twelfthPercentage} />
            </div>
          </Section>

          <Section title="Skills">
            <SkillsInput skills={form.skills} onChange={(skills) => setField('skills', skills)} />
          </Section>

          <Section title="Links">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="LinkedIn" id="linkedIn" name="linkedIn" type="url" placeholder="https://linkedin.com/in/..." value={form.linkedIn} onChange={handleChange} error={errors.linkedIn} />
              <Input label="GitHub" id="github" name="github" type="url" placeholder="https://github.com/..." value={form.github} onChange={handleChange} error={errors.github} />
            </div>
          </Section>

          <Section title="Experience / Internships">
            <ListSection items={form.experience} fields={EXPERIENCE_FIELDS} emptyItem={EMPTY_EXPERIENCE} onChange={(items) => setField('experience', items)} addLabel="Add experience" />
          </Section>

          <Section title="Projects">
            <ListSection items={form.projects} fields={PROJECT_FIELDS} emptyItem={EMPTY_PROJECT} onChange={(items) => setField('projects', items)} addLabel="Add project" />
          </Section>

          <Section title="Certificates">
            <ListSection items={form.certificates} fields={CERTIFICATE_FIELDS} emptyItem={EMPTY_CERTIFICATE} onChange={(items) => setField('certificates', items)} addLabel="Add certificate" />
          </Section>

          {/* Sticky save bar so the button is always reachable on a long form */}
          <div className="sticky bottom-0 -mx-4 border-t bg-white/95 px-4 py-3 sm:mx-0 sm:rounded-xl sm:border sm:shadow-sm">
            <Button type="submit" loading={saving} className="w-full sm:w-auto">
              Save profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StudentProfile
