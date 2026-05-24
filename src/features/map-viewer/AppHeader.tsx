import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'
import { getLastLogin, formatLoginDate } from '../../lib/lastLogin'
import styles from './AppHeader.module.css'

interface AppHeaderProps {
  applicationId: string
}

export function AppHeader({ applicationId }: AppHeaderProps) {
  const auth = useAuth()
  const navigate = useNavigate()
  const lastLogin = getLastLogin()
  const userName = (auth.user?.profile.name ?? auth.user?.profile.email ?? 'User') as string
  const avatarChar = userName.charAt(0).toUpperCase()

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <button
          className={styles.backLink}
          onClick={() => navigate('/dashboard')}
          aria-label="Back to dashboard"
        >
          ←
        </button>
        <svg className={styles.logo} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
        <div className={styles.titleStack}>
          <span className={styles.appTitle}>BIM Data Viewer</span>
          <span className={styles.orgName}>CAAS</span>
        </div>
        <span className={styles.divider} />
        <div className={styles.appIdBlock}>
          <span className={styles.appIdLabel}>Application ID</span>
          <span className={styles.appIdValue}>{applicationId}</span>
        </div>
      </div>
      <div className={styles.userBlock}>
        <div className={styles.userAvatar} aria-hidden="true">
          {avatarChar}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{userName}</span>
          {lastLogin && (
            <span className={styles.lastLogin}>Last Login: {formatLoginDate(lastLogin)}</span>
          )}
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
