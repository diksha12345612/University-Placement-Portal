// Where each role lands after logging in
export const getDashboardPath = (role) => {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'recruiter') return '/recruiter/dashboard'
  return '/student/dashboard'
}
