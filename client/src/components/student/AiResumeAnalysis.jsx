import { useState } from 'react'
import toast from 'react-hot-toast'
import { Sparkles } from 'lucide-react'
import api, { getErrorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Button from '../Button'
import ResumeInsights from './ResumeInsights'

// Profile page: button to run the AI, then the saved result
const AiResumeAnalysis = () => {
  const { user, setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const profile = user.studentProfile || {}
  const analysis = profile.aiResumeAnalysis

  const analyze = async () => {
    setLoading(true)
    try {
      const res = await api.post('/students/resume/analyze')
      setUser(res.data.user)
      toast.success(res.data.message)
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 6000 })
    } finally {
      setLoading(false)
    }
  }

  const button = (
    <Button onClick={analyze} loading={loading} disabled={!profile.resumePublicId}>
      {analysis?.score != null ? 'Re-analyze Resume' : 'Analyze my resume'}
    </Button>
  )

  if (analysis?.score != null && !loading) {
    return <ResumeInsights analysis={analysis} action={button} />
  }

  return (
    <div className="card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Sparkles size={22} />
        </span>
        <div>
          <h2 className="text-lg font-semibold">AI Resume Insights</h2>
          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? 'The AI is reading your resume. This can take up to a minute...'
              : profile.resumePublicId
                ? 'Get a score out of 100, a five-part breakdown and tips to improve.'
                : 'Upload your resume above to unlock AI-powered analysis.'}
          </p>
        </div>
      </div>
      {button}
    </div>
  )
}

export default AiResumeAnalysis
