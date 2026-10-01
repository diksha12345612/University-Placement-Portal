import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Camera } from 'lucide-react'
import api, { getErrorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const MAX_MB = 2
const TYPES = ['image/jpeg', 'image/png', 'image/webp']

const PhotoCard = () => {
  const { user, setUser } = useAuth()
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const photoUrl = user.studentProfile?.photoUrl

  const handleFile = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (!TYPES.includes(file.type)) return toast.error('Only JPG, PNG or WebP images are allowed')
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(`Image is too large. Maximum size is ${MAX_MB} MB`)

    const formData = new FormData()
    formData.append('photo', file)
    setBusy(true)
    try {
      const res = await api.post('/students/photo', formData)
      setUser(res.data.user)
      toast.success(res.data.message)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const removePhoto = async () => {
    setBusy(true)
    try {
      const res = await api.delete('/students/photo')
      setUser(res.data.user)
      toast.success(res.data.message)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card flex flex-wrap items-center gap-5 p-5">
      <button
        type="button"
        onClick={() => inputRef.current.click()}
        disabled={busy}
        className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/60"
        aria-label="Upload profile photo"
      >
        {photoUrl ? (
          <img src={photoUrl} alt="Your profile" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm text-slate-500">No photo</span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/50 text-white opacity-0 transition group-hover:opacity-100">
          <Camera size={22} />
        </span>
      </button>
      <div className="flex-1">
        <h2 className="font-semibold">Profile Photo</h2>
        <p className="mt-1 text-sm text-slate-500">A clear photo of your face (JPG, PNG or WebP, max {MAX_MB} MB). Optional.</p>
        <div className="mt-3 flex gap-3 text-sm font-semibold">
          <button type="button" onClick={() => inputRef.current.click()} disabled={busy} className="text-blue-600 hover:underline disabled:opacity-50">
            {busy ? 'Please wait...' : photoUrl ? 'Change photo' : 'Upload photo'}
          </button>
          {photoUrl && (
            <button type="button" onClick={removePhoto} disabled={busy} className="text-red-600 hover:underline disabled:opacity-50">
              Remove
            </button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
    </div>
  )
}

export default PhotoCard
