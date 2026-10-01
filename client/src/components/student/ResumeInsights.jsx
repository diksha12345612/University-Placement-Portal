import { formatDate } from '../../utils/format'
import ScoreRing from '../ScoreRing'

// The five parts the AI scores (0-20 each). Each has its own colour and a text label,
// so the meaning never depends on colour alone.
const PARTS = [
  { key: 'technicalSkills', label: 'Technical Skills', color: '#2a78d6' },
  { key: 'projects', label: 'Projects', color: '#4a3aa7' },
  { key: 'experience', label: 'Experience', color: '#1baf7a' },
  { key: 'atsScore', label: 'ATS Score', color: '#eb6834' },
  { key: 'clarity', label: 'Clarity & Impact', color: '#e34948' },
]

export const scoreLabel = (score) => {
  if (score >= 75) return { text: 'Strong', style: 'bg-green-50 text-green-700 ring-green-200' }
  if (score >= 50) return { text: 'Good', style: 'bg-blue-50 text-blue-700 ring-blue-200' }
  return { text: 'Needs work', style: 'bg-orange-50 text-orange-700 ring-orange-200' }
}

const List = ({ title, items, dot }) =>
  items?.length > 0 && (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )

// Shows a saved AI resume analysis. "action" is an optional button shown in the header.
const ResumeInsights = ({ analysis, action, showLists = true }) => {
  const label = scoreLabel(analysis.score)

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">AI Resume Insights</h2>
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ring-1 ring-inset ${label.style}`}>{label.text}</span>
        </div>
        {action}
      </div>
      <p className="mt-1 text-xs text-slate-400">Analysed on {formatDate(analysis.analyzedAt)}. AI guidance, not a final judgement.</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <ScoreRing value={analysis.score} size={136} stroke={12} color="#16a34a">
            <span className="font-display text-4xl font-bold">{analysis.score}</span>
            <span className="text-xs text-slate-500">out of 100</span>
          </ScoreRing>
        </div>

        {analysis.breakdown ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {PARTS.map((part) => {
              const value = analysis.breakdown[part.key] ?? 0
              return (
                <div key={part.key} className="flex flex-col items-center rounded-2xl border border-slate-200 p-4 text-center">
                  <ScoreRing value={value} max={20} size={68} stroke={7} color={part.color}>
                    <span className="text-xs font-bold">{Math.round((value / 20) * 100)}%</span>
                  </ScoreRing>
                  <p className="mt-2 text-xs font-medium text-slate-700">{part.label}</p>
                  <p className="text-sm font-bold tabular-nums text-slate-900">{value}/20</p>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="self-center text-sm text-slate-500">Analyse again to see the detailed breakdown.</p>
        )}
      </div>

      {showLists && (
        <div className="mt-6 grid gap-6 border-t border-slate-200 pt-5 md:grid-cols-3">
          <List title="Strengths" items={analysis.strengths} dot="bg-green-500" />
          <List title="Missing Skills" items={[...(analysis.missingSkills || []), ...(analysis.weaknesses || []).slice(0, 2)]} dot="bg-orange-500" />
          <List title="Improvement Tips" items={analysis.suggestions} dot="bg-blue-500" />
        </div>
      )}
    </div>
  )
}

export default ResumeInsights
