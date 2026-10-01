import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { MAX_RESUME_SIZE_MB } from '../../utils/constants'
import { openResume } from '../../utils/resume'
import Button from '../Button'

const ResumeCard = () => {
  const { user, setUser } = useAuth()
  const profile = user.studentProfile || {}
  const fileInputRef = useRef(null)
  const [busy, setBusy] = useState('') // 'upload' | 'view' | 'delete' | ''

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    e.target.value = '' // lets the user pick the same file again later
    if (!file) return

    // Quick checks in the browser. The backend checks again.
    if (file.type !== 'application/pdf') return toast.error('Only PDF files are allowed')
    if (file.size > MAX_RESUME_SIZE_MB * 1024 * 1024) {
      return toast.error(`File is too large. Maximum size is ${MAX_RESUME_SIZE_MB} MB`)
    }

    // Files are sent as multipart/form-data, not JSON
    const formData = new FormData()
    formData.append('resume', file)

    setBusy('upload')
    try {
      const res = await api.post('/students/resume', formData)
      setUser(res.data.user)
      toast.success(res.data.message, { duration: 5000 })
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusy('')
    }
  }

  const handleView = async () => {
    setBusy('view')
    await openResume('/students/resume')
    setBusy('')
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete your resume? You can upload a new one any time.')) return

    setBusy('delete')
    try {
      const res = await api.delete('/students/resume')
      setUser(res.data.user)
      toast.success(res.data.message)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="card p-5">
      <h2 className="font-semibold">Resume</h2>
      <p className="mt-1 text-sm text-gray-500">
        PDF only, up to {MAX_RESUME_SIZE_MB} MB. Use a text-based PDF (not a scanned photo) so AI analysis can read it.
      </p>

      {profile.resumePublicId ? (
        <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
          <p className="font-medium break-all">{profile.resumeFileName}</p>
          <p className="text-gray-500">Uploaded on {new Date(profile.resumeUploadedAt).toLocaleDateString()}</p>
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">No resume uploaded yet.</p>
      )}

      <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" loading={busy === 'upload'} disabled={!!busy} onClick={() => fileInputRef.current.click()}>
          {profile.resumePublicId ? 'Replace resume' : 'Upload resume'}
        </Button>
        {profile.resumePublicId && (
          <>
            <Button type="button" variant="secondary" loading={busy === 'view'} disabled={!!busy} onClick={handleView}>
              View
            </Button>
            <Button type="button" variant="secondary" loading={busy === 'delete'} disabled={!!busy} onClick={handleDelete}>
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default ResumeCard
