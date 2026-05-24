import { Navigate } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { hasAnyRole, type AppRole } from '../config/auth'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  roles: AppRole[]
  children: ReactNode
}

export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const auth = useAuth()

  if (auth.isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ fontFamily: 'sans-serif', color: '#666' }}>Loading…</p>
      </div>
    )
  }

  if (auth.error) {
    return <Navigate to="/login" replace />
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!hasAnyRole(auth.user, roles)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
