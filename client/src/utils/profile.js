const hasValue = (value) => value !== undefined && value !== null && value !== ''

const MIN_SKILLS = 3

// Shows students how much of their profile is filled, so recruiters see complete profiles.
// Experience and certificates are not counted: many freshers do not have them yet.
export const getProfileCompletion = (user) => {
  const p = user?.studentProfile || {}

  const checks = [
    { label: 'Roll number', done: hasValue(p.rollNumber) },
    { label: 'Department', done: hasValue(p.department) },
    { label: 'Batch', done: hasValue(p.batch) },
    { label: 'CGPA', done: hasValue(p.cgpa) },
    { label: 'Phone', done: hasValue(p.phone) },
    { label: '10th percentage', done: hasValue(p.tenthPercentage) },
    { label: '12th percentage', done: hasValue(p.twelfthPercentage) },
    { label: `At least ${MIN_SKILLS} skills`, done: (p.skills || []).length >= MIN_SKILLS },
    { label: 'At least 1 project', done: (p.projects || []).length > 0 },
    { label: 'LinkedIn or GitHub', done: hasValue(p.linkedIn) || hasValue(p.github) },
    { label: 'Resume', done: hasValue(p.resumePublicId) },
  ]

  const doneCount = checks.filter((c) => c.done).length
  return {
    percent: Math.round((doneCount / checks.length) * 100),
    missing: checks.filter((c) => !c.done).map((c) => c.label),
  }
}
