import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDashboardPath } from '../utils/roleRoutes'
import Spinner from './Spinner'

// Pages like Login and Register: a logged-in user is sent to their dashboard instead
const GuestRoute = () => {
  const { user, loading } = useAuth()

  if (loading) return <Spinner fullScreen />
  if (user) return <Navigate to={getDashboardPath(user.role)} replace />

  return <Outlet />
}

export default GuestRoute
