import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'
import { getLastLogin, formatLoginDate } from '../../lib/lastLogin'
import { ROLE_LABELS, getPrimaryRole } from '../../config/auth'
import styles from './DashboardHeader.module.css'

function PlaneIcon() {
  return (
    <svg className={styles.logo} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
  )
}

export function DashboardHeader() {
  const auth = useAuth()
  const navigate = useNavigate()
  const lastLogin = getLastLogin()
  const userName = (auth.user?.profile.name ?? auth.user?.profile.email ?? 'User') as string
  const role = getPrimaryRole(auth.user)
  const roleLabel = role ? ROLE_LABELS[role] : ''
  const avatarChar = userName.charAt(0).toUpperCase()

  return (
    <header className={styles.header}>
      <button
        className={styles.brand}
        onClick={() => navigate('/dashboard')}
        aria-label="Go to dashboard"
      >
        <PlaneIcon />
        <div className={styles.titleStack}>
          <span className={styles.appTitle}>
            Sky<span className={styles.accent}>SAFE</span> 2.0
          </span>
          <span className={styles.orgName}>Civil Aviation Authority of Singapore</span>
        </div>
      </button>

      <div className={styles.userBlock}>
        {lastLogin && (
          <span className={styles.lastLogin}>Last Login: {formatLoginDate(lastLogin)}</span>
        )}
        <div className={styles.avatar} aria-hidden="true">
          {avatarChar}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{userName}</span>
          <span className={styles.roleLabel}>{roleLabel}</span>
        </div>
        <button
          className={styles.logoutBtn}
          onClick={() => void auth.signoutRedirect()}
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}
