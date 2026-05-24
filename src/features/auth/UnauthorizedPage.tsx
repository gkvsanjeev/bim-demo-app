import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'
import { ROLE_LABELS, getPrimaryRole } from '../../config/auth'
import styles from './UnauthorizedPage.module.css'

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export function UnauthorizedPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const role = getPrimaryRole(auth.user)

  const handleSignOut = () => {
    void auth.signoutRedirect()
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconArea}>
          <LockIcon />
        </div>

        <h1 className={styles.title}>Access Restricted</h1>
        <p className={styles.message}>
          Your account does not have permission to view this page.
        </p>

        {auth.user?.profile.email && (
          <div className={styles.userChip}>
            <span className={styles.userEmail}>{auth.user.profile.email as string}</span>
            {role && <span className={styles.roleBadge}>{ROLE_LABELS[role]}</span>}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={handleSignOut}>
            Sign out and try again
          </button>
          <button className={styles.secondaryBtn} onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>

        <p className={styles.contactNote}>
          Need access? Contact your CAAS system administrator.
        </p>
      </div>
    </div>
  )
}
