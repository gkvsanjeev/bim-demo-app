import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { syncUser } from '../../lib/api'
import { getPrimaryRole } from '../../config/auth'
import styles from './CallbackPage.module.css'

export function CallbackPage() {
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (auth.error) {
      navigate('/login', { replace: true })
    } else if (auth.isAuthenticated && auth.user) {
      const profile = auth.user.profile
      const role = getPrimaryRole(auth.user) ?? 'public_user'
      syncUser({
        keycloak_id: profile.sub,
        email: (profile.email as string | undefined) ?? '',
        full_name: (profile.name as string | undefined) ?? (profile.email as string | undefined) ?? '',
        role,
      })
        .then(({ last_login_at }) => {
          // Store previous session time so DashboardHeader can display it
          if (last_login_at) {
            localStorage.setItem('skysafe_last_login', new Date(last_login_at).toISOString())
          } else {
            localStorage.removeItem('skysafe_last_login')
          }
        })
        .catch(() => {
          // Fallback: record current time locally if API is unreachable
          localStorage.setItem('skysafe_last_login', new Date().toISOString())
        })
        .finally(() => navigate('/dashboard', { replace: true }))
    }
  }, [auth.isAuthenticated, auth.error, auth.user, navigate])

  if (auth.error) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>Authentication failed: {auth.error.message}</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.spinner} />
      <p className={styles.message}>Completing sign in…</p>
    </div>
  )
}
