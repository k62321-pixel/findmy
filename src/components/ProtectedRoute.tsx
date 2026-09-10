import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/AuthProvider'

/** Redirects to /login (remembering where the user was headed) until a session exists. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return null
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}
