import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { BadgeCheck, Briefcase, Building2, FileText, GraduationCap, Percent, Trophy, UserCheck } from 'lucide-react'
import Spinner from '../../components/Spinner'
import StatCard from '../../components/StatCard'
import { CompanyChart, DepartmentChart } from '../../components/admin/PlacementCharts'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [batch, setBatch] = useState('') // '' = all batches
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/admin/stats', { params: batch ? { batch } : {} })
      .then((res) => {
        setStats(res.data.stats)
        // keep the full list of batches from the first (unfiltered) load
        if (!batch) setBatches(res.data.stats.batches)
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [batch])

  const changeBatch = (e) => {
    setLoading(true)
    setBatch(e.target.value)
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
          <p className="mt-1 text-gray-500">Training &amp; Placement Office</p>
        </div>
        <label className="text-sm">
          <span className="mr-2 text-gray-600">Batch</span>
          <select value={batch} onChange={changeBatch} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="">All batches</option>
            {batches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading || !stats ? (
        <Spinner />
      ) : (
        <>
          {/* Placement headline numbers (these follow the batch filter) */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={GraduationCap} label="Students" value={stats.totalStudents} to="/admin/students" />
            <StatCard icon={UserCheck} tone="green" label="Placed students" value={stats.placedStudents} />
            <StatCard icon={Percent} tone="cyan" label="Placement rate" value={`${stats.placementPercentage}%`} />
            <StatCard icon={Trophy} tone="orange" label="Selections" value={stats.applicationStatus.selected} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DepartmentChart data={stats.departmentWise} />
            <CompanyChart data={stats.companyWise} />
          </div>

          {/* Work waiting for the admin (not batch-specific) */}
          <h2 className="mt-8 font-semibold">Needs your attention</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={Building2} tone="orange" label="Recruiters to approve" value={stats.pendingRecruiters} to="/admin/recruiters" hint={stats.pendingRecruiters > 0 ? 'Review now →' : ''} />
            <StatCard icon={BadgeCheck} tone="orange" label="Jobs to approve" value={stats.pendingJobs} to="/admin/jobs" hint={stats.pendingJobs > 0 ? 'Review now →' : ''} />
            <StatCard icon={Briefcase} label="Open jobs" value={stats.openJobs} />
            <StatCard icon={FileText} tone="cyan" label="Total applications" value={stats.totalApplications} />
          </div>
        </>
      )}
    </div>
  )
}

export default AdminDashboard
