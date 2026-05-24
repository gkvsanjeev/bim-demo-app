import { useAuth } from 'react-oidc-context'
import { getPrimaryRole } from '../../config/auth'
import { PublicDashboard } from './PublicDashboard'
import { CaasDashboard } from './CaasDashboard'

export function DashboardPage() {
  const auth = useAuth()
  const role = getPrimaryRole(auth.user)
  if (role === 'public_user') return <PublicDashboard />
  return <CaasDashboard />
}
