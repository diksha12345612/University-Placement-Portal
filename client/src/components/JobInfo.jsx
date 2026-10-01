import { formatDate } from '../utils/format'

// Full job details. Used by the student job page and the admin review page.
const JobInfo = ({ job }) => {
  const rules = job.eligibility || {}

  const facts = [
    { label: 'Type', value: job.type },
    { label: 'Location', value: job.location },
    { label: 'Salary / Stipend', value: job.salary || 'Not mentioned' },
    { label: 'Openings', value: job.openings },
    { label: 'Apply before', value: formatDate(job.deadline) },
  ]

  return (
    <div className="space-y-5 text-sm">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {facts.map((fact) => (
          <div key={fact.label} className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">{fact.label}</p>
            <p className="mt-0.5 font-medium">{fact.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h3 className="mb-1 font-semibold">About the role</h3>
        <p className="whitespace-pre-line text-gray-700">{job.description}</p>
      </section>

      {job.requirements?.length > 0 && (
        <section>
          <h3 className="mb-1 font-semibold">Requirements</h3>
          <ul className="list-disc space-y-0.5 pl-5 text-gray-700">
            {job.requirements.map((req) => (
              <li key={req}>{req}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-1 font-semibold">Eligibility</h3>
        <ul className="space-y-0.5 text-gray-700">
          <li>Minimum CGPA: {rules.minCGPA > 0 ? rules.minCGPA : 'No minimum'}</li>
          <li>Branches: {rules.branches?.length > 0 ? rules.branches.join(', ') : 'All branches'}</li>
          <li>Batch: {rules.batch || 'Any batch'}</li>
        </ul>
        {rules.skills?.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-gray-500">Preferred skills:</span>
            {rules.skills.map((skill) => (
              <span key={skill} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700">
                {skill}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default JobInfo
