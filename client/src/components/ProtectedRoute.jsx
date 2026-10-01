import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDashboardPath } from '../utils/roleRoutes'
import Spinner from './Spinner'

// Only lets logged-in users with one of the allowed roles see the child routes.
// This is for user experience only. The real security check is on the backend.
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner fullScreen />

  if (!user) {
    // Remember where the user wanted to go, so we can send them back after login
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
