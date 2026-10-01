import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import { formatDate } from '../../utils/format'
import Tabs from '../../components/Tabs'
import Spinner from '../../components/Spinner'

const TABS = [
  { value: 'pending', label: 'Waiting for approval' },
  { value: 'approved', label: 'Approved' },
]

const ManageRecruiters = () => {
  const [tab, setTab] = useState('pending')
  const [recruiters, setRecruiters] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    api
      .get(`/admin/recruiters?status=${tab}`)
      .then((res) => setRecruiters(res.data.recruiters))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [tab])

  const changeTab = (value) => {
    setLoading(true)
    setTab(value)
  }

  const setApproval = async (recruiter, isApproved) => {
    if (!isApproved && !window.confirm(`Remove access for ${recruiter.name}? They will not be able to log in.`)) return

    setBusyId(recruiter._id)
    try {
      const res = await api.patch(`/admin/recruiters/${recruiter._id}/approval`, { isApproved })
      toast.success(res.data.message)
      // The recruiter moved to the other tab, so remove them from this list
      setRecruiters(recruiters.filter((r) => r._id !== recruiter._id))
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusyId('')
    }
  }

  return (
    <div>
      <p className="mb-4 mt-1 text-gray-500">Approve company recruiters before they can log in and post jobs.</p>

      <Tabs tabs={TABS} active={tab} onChange={changeTab} />

      {loading ? (
        <Spinner />
      ) : recruiters.length === 0 ? (
        <div className="mt-6 card p-8 text-center text-gray-500">No recruiters here.</div>
      ) : (
        <div className="mt-6 overflow-x-auto card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Recruiter</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Registered</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {recruiters.map((r) => (
                <tr key={r._id} className="border-b align-top last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.name}</p>
                    <p className="text-gray-500">{r.recruiterProfile?.designation}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{r.recruiterProfile?.companyName}</p>
                    {r.recruiterProfile?.website && (
                      <a href={r.recruiterProfile.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        Website
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p>{r.email}</p>
                    <p className="text-gray-500">{r.recruiterProfile?.phone}</p>
                    {!r.isVerified && <p className="text-xs text-red-600">Email not verified</p>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    {tab === 'pending' ? (
                      <button
                        onClick={() => setApproval(r, true)}
                        disabled={busyId === r._id || !r.isVerified}
                        title={r.isVerified ? '' : 'The recruiter must verify their email first'}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => setApproval(r, false)}
                        disabled={busyId === r._id}
                        className="rounded-lg border border-red-300 px-3 py-1.5 text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Remove access
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ManageRecruiters
