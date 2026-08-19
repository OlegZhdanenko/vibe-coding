import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageLoader } from '@/components/common/page-loader'
import { useAuth } from '@/features/auth/auth-context'

/** Blocks the private area until a session exists, remembering the intent. */
export function RequireAuth() {
  const { user, initialising } = useAuth()
  const location = useLocation()

  if (initialising) return <PageLoader label="Checking your session" />

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}

/** Keeps signed-in users off the login and signup screens. */
export function RequireGuest() {
  const { user, initialising } = useAuth()

  if (initialising) return <PageLoader label="Checking your session" />
  if (user) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
