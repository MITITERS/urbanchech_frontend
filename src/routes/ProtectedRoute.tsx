import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FullScreenMessage } from '@/components/common/FullScreenMessage'
import { ForbiddenPage } from '@/routes/pages/ForbiddenPage'
import { CHANGE_PASSWORD_ROUTE, LOGIN_ROUTE } from '@/config/constants'
import { messages } from '@/config/messages'
import { useAuth } from '@/hooks/useAuth'
import { isPanelRole, type Role } from '@/types/auth'

interface ProtectedRouteProps {
  /**
   * Extra restriction on top of "must be municipal staff". Omit it to allow any
   * panel role.
   */
  allowedRoles?: readonly Role[]
}

/**
 * Guards authentication *and* role. A user with a valid session but a non
 * municipal role gets the "insufficient permissions" screen instead of a silent
 * redirect: bouncing them back to the login screen would look like a broken
 * password.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <FullScreenMessage title={messages.auth.checkingSession} />
  }

  if (status === 'anonymous' || !user) {
    return <Navigate to={LOGIN_ROUTE} replace state={{ from: location.pathname }} />
  }

  if (!isPanelRole(user.role)) {
    return <ForbiddenPage />
  }

  // A temporary password locks the whole panel until it is replaced.
  if (user.mustChangePassword && location.pathname !== CHANGE_PASSWORD_ROUTE) {
    return <Navigate to={CHANGE_PASSWORD_ROUTE} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <ForbiddenPage />
  }

  return <Outlet />
}
