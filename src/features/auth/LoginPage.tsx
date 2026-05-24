import { useAuth } from 'react-oidc-context'
import { Navigate } from 'react-router-dom'
import styles from './LoginPage.module.css'

function PlaneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
      <path d="M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export function LoginPage() {
  const auth = useAuth()

  if (auth.isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleCaasSignIn = () => {
    void auth.signinRedirect()
  }

  // Passes kc_idp_hint=google to Keycloak so it skips its own login page
  // and redirects straight to Google. Remove this param if not using Keycloak.
  const handlePublicSignIn = () => {
    void auth.signinRedirect({ extraQueryParams: { kc_idp_hint: 'google' } })
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <PlaneIcon />
          </div>
        </div>

        {/* App identity */}
        <h1 className={styles.appName}>
          Sky<span className={styles.appNameAccent}>SAFE</span> 2.0
        </h1>
        <p className={styles.orgName}>Civil Aviation Authority of Singapore</p>
        <p className={styles.tagline}>Building Height Consultation System</p>

        <div className={styles.divider} />

        {/* Sign-in actions */}
        <p className={styles.sectionLabel}>Sign in to continue</p>

        <button className={styles.primaryBtn} onClick={handleCaasSignIn} disabled={auth.isLoading}>
          <ShieldIcon />
          {auth.isLoading ? 'Redirecting…' : 'CAAS Officer — Corporate SSO'}
        </button>

        <button className={styles.secondaryBtn} onClick={handlePublicSignIn} disabled={auth.isLoading}>
          <GoogleIcon />
          Public User — Sign in with Google
        </button>

        {auth.error && (
          <p className={styles.errorMsg}>Sign-in failed: {auth.error.message}</p>
        )}

        {/* Role guide */}
        <div className={styles.roleNote}>
          <div className={styles.roleNoteRow}>
            <span className={styles.roleNoteLabel}>CAAS Officer</span>
            <span>Inspection officers and approving officers — use your CAAS corporate account.</span>
          </div>
          <div className={styles.roleNoteRow}>
            <span className={styles.roleNoteLabel}>Public User</span>
            <span>Building owners, architects, agents — submit proposals and track status.</span>
          </div>
        </div>

        <p className={styles.footer}>
          Access restricted to authorised users only.
        </p>
      </div>
    </div>
  )
}
