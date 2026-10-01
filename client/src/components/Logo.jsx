import { GraduationCap } from 'lucide-react'

// App logo: gradient icon tile + name. "light" is for dark/blue backgrounds.
const Logo = ({ light = false }) => (
  <div className="flex items-center gap-2.5">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20">
      <GraduationCap size={20} />
    </span>
    <span className={`font-display text-lg font-bold ${light ? 'text-white' : 'text-slate-900'}`}>
      Placement<span className={light ? 'text-blue-200' : 'text-blue-600'}>Portal</span>
    </span>
  </div>
)

export default Logo
