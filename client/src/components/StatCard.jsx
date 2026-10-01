import { Link } from 'react-router-dom'

const TONES = {
  blue: 'bg-indigo-50 text-indigo-600',
  green: 'bg-green-50 text-green-600',
  orange: 'bg-orange-50 text-orange-600',
  cyan: 'bg-sky-50 text-sky-600',
}

// Number tile with a coloured icon. Becomes a link when "to" is given.
const StatCard = ({ icon: Icon, label, value, tone = 'blue', to, hint }) => {
  const content = (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${TONES[tone]}`}>
        <Icon size={22} />
      </span>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-0.5 font-display text-3xl font-bold text-slate-900">{value}</p>
        {hint && <p className="mt-1 text-xs font-medium text-blue-600">{hint}</p>}
      </div>
    </div>
  )

  return to ? (
    <Link to={to} className="card p-5 transition hover:border-blue-200 hover:shadow-md">
      {content}
    </Link>
  ) : (
    <div className="card p-5">{content}</div>
  )
}

export default StatCard
