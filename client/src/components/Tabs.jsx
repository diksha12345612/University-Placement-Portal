// Simple tab bar. tabs = [{ value: 'pending', label: 'Pending' }, ...]
const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
    {tabs.map((tab) => (
      <button
        key={tab.value}
        type="button"
        onClick={() => onChange(tab.value)}
        className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition ${
          active === tab.value ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
)

export default Tabs
