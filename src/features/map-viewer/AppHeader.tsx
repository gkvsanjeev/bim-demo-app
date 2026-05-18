import styles from './AppHeader.module.css'

interface AppHeaderProps {
  applicationId: string
}

const MOCK_USER_NAME = 'Sanjeev Kumar'
// ASSUMPTION(US-21): Using mock user data until auth (Corppass/AD OIDC) is integrated
const LAST_LOGIN = new Date('2026-05-16T09:30:00')

export function AppHeader({ applicationId }: AppHeaderProps) {
  const formattedLastLogin = LAST_LOGIN.toLocaleDateString('en-SG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
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
          {MOCK_USER_NAME.charAt(0)}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{MOCK_USER_NAME}</span>
          <span className={styles.lastLogin}>Last Login: {formattedLastLogin}</span>
        </div>
      </div>
    </header>
  )
}
