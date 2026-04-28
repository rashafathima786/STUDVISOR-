import { Navigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'

/**
 * Role-based route guard.
 * Props:
 *   allowedRoles — array of roles that can access (e.g. ['faculty', 'hod', 'admin'])
 *   children     — protected content
 *   redirectTo   — where to send wrong-role users (default: their dashboard)
 */
export default function RoleGuard({ allowedRoles = [], children, redirectTo }) {
  const { isAuthenticated, role } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Send wrong-role users to their own dashboard
    const dest = redirectTo || getDashboardForRole(role)
    return <Navigate to={dest} replace />
  }

  return children
}

function getDashboardForRole(role) {
  switch (role) {
    case 'faculty':
    case 'hod':
      return '/faculty/dashboard'
    case 'admin':
      return '/admin/dashboard'
    default:
      return '/dashboard'
  }
}
