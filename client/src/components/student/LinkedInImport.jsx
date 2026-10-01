import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Sparkles } from 'lucide-react'
import api, { getErrorMessage } from '../../services/api'

// Upload a LinkedIn "Save to PDF" file. The AI reads it and the found details are handed to
// the profile form through onImported. Nothing is saved until the student clicks Save profile.
const LinkedInImport = ({ onImported }) => {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (file.type !== 'application/pdf') return toast.error('Please choose the PDF you downloaded from LinkedIn')
    if (file.size > 2 * 1024 * 1024) return toast.error('File is too large. Maximum size is 2 MB')

    const formData = new FormData()
    formData.append('linkedin', file)
    setBusy(true)
    try {
      const res = await api.post('/students/linkedin-import', formData)
      onImported(res.data.imported)
      toast.success(res.data.message, { duration: 6000 })
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 7000 })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
      <div>
        <p className="flex items-center gap-2 font-semibold text-blue-700">
          <Sparkles size={18} /> Quick Setup with LinkedIn
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {busy
            ? 'The AI is reading your LinkedIn PDF...'
            : 'On LinkedIn open your profile, click More then Save to PDF, and upload it here. We fill the form; you check it and save.'}
        </p>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current.click()}
        disabled={busy}
        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
      >
        {busy ? 'Please wait...' : 'Upload LinkedIn PDF'}
      </button>
      <input ref={inputRef} type="file" accept="application/pdf" onChange={handleFile} className="hidden" />
    </div>
  )
}

export default LinkedInImport
