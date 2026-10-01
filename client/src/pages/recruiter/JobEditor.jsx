import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import JobForm from '../../components/recruiter/JobForm'
import Spinner from '../../components/Spinner'

// One page for both routes:
//   /recruiter/jobs/new       -> post a new job
//   /recruiter/jobs/:id/edit  -> edit an existing job
const JobEditor = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    api
      .get(`/recruiter/jobs/${id}`)
      .then((res) => setJob(res.data.job))
      .catch((error) => {
        toast.error(getErrorMessage(error))
        navigate('/recruiter/jobs')
      })
      .finally(() => setLoading(false))
  }, [id, isEdit, navigate])

  const handleSubmit = async (payload) => {
    if (isEdit && job.status === 'approved') {
      const ok = window.confirm('Editing an approved job sends it back for admin approval. Students will not see it until it is approved again. Continue?')
      if (!ok) return
    }

    setSubmitting(true)
    try {
      const res = isEdit ? await api.put(`/recruiter/jobs/${id}`, payload) : await api.post('/recruiter/jobs', payload)
      toast.success(res.data.message, { duration: 5000 })
      navigate('/recruiter/jobs')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/recruiter/jobs" className="text-sm text-blue-600 hover:underline">
        &larr; Back to my jobs
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{isEdit ? 'Edit job' : 'Post a new job'}</h1>
      <p className="mb-6 mt-1 text-gray-500">The placement office reviews every job before students can see it.</p>

      {/* key makes the form reset when the loaded job changes */}
      <JobForm key={job?._id || 'new'} initialJob={job} onSubmit={handleSubmit} submitting={submitting} submitLabel={isEdit ? 'Save and send for approval' : 'Submit for approval'} />
    </div>
  )
}

export default JobEditor
