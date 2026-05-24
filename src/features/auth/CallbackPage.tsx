import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { recordLogin } from '../../lib/lastLogin'
import styles from './CallbackPage.module.css'

export function CallbackPage() {
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (auth.error) {
      navigate('/login', { replace: true })
    } else if (auth.isAuthenticated) {
      recordLogin()
      navigate('/dashboard', { replace: true })
    }
  }, [auth.isAuthenticated, auth.error, navigate])

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
