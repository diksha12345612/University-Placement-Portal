const COLORS = {
  // job approval
  pending: 'bg-orange-50 text-orange-700 ring-orange-200',
  approved: 'bg-green-50 text-green-700 ring-green-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
  closed: 'bg-slate-100 text-slate-600 ring-slate-200',
  // eligibility
  eligible: 'bg-green-50 text-green-700 ring-green-200',
  'not eligible': 'bg-red-50 text-red-700 ring-red-200',
  // application
  applied: 'bg-blue-50 text-blue-700 ring-blue-200',
  shortlisted: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  interview: 'bg-purple-50 text-purple-700 ring-purple-200',
  selected: 'bg-green-50 text-green-700 ring-green-200',
}

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${
      COLORS[status] || 'bg-slate-100 text-slate-600 ring-slate-200'
    }`}
  >
    {status}
  </span>
)

export default StatusBadge
