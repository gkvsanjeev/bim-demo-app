import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { DashboardHeader } from './DashboardHeader'
import { fetchUserSubmissions } from '../../lib/api'
import type { Submission } from '../../types/submission'
import styles from './PublicDashboard.module.css'

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  Submitted: { color: '#0079c1', bg: '#e6f3fb' },
  'Under Review': { color: '#c46000', bg: '#fef3e2' },
  Approved: { color: '#2e7d32', bg: '#e8f5e9' },
  Returned: { color: '#c62828', bg: '#fce8e6' },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${dd}/${mm}/${yy}`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PublicDashboard() {
  const auth = useAuth()
  const navigate = useNavigate()
  const keycloakId = auth.user?.profile.sub
  const [submissions, setSubmissions] = useState<Submission[]>([])

  useEffect(() => {
    if (!keycloakId) return
    fetchUserSubmissions(keycloakId)
      .then((data) => setSubmissions(data))
      .catch(console.error)
  }, [keycloakId])

  const userName = (auth.user?.profile.name ?? auth.user?.profile.email ?? 'User') as string
  const firstName = userName.split(' ')[0]

  const stats = {
    total: submissions.length,
    underReview: submissions.filter((s) => s.status === 'Under Review').length,
    approved: submissions.filter((s) => s.status === 'Approved').length,
  }

  return (
    <div className={styles.page}>
      <DashboardHeader />
      <main className={styles.main}>
        <div className={styles.welcome}>
          <div>
            <h1 className={styles.welcomeTitle}>Welcome, {firstName}</h1>
            <p className={styles.welcomeSub}>
              Manage your building height consultation applications
            </p>
          </div>
          <button className={styles.newAppBtn} onClick={() => navigate('/submit')}>
            + New Application
          </button>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Total Applications</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue} style={{ color: '#c46000' }}>
              {stats.underReview}
            </span>
            <span className={styles.statLabel}>Under Review</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue} style={{ color: '#2e7d32' }}>
              {stats.approved}
            </span>
            <span className={styles.statLabel}>Approved</span>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>My Applications</h2>
          {submissions.length === 0 ? (
            <div className={styles.emptyState}>
              <svg
                viewBox="0 0 64 64"
                width="56"
                height="56"
                fill="none"
                className={styles.emptyIcon}
                aria-hidden="true"
              >
                <rect x="8" y="14" width="48" height="36" rx="4" stroke="#d1d5db" strokeWidth="2" />
                <line x1="16" y1="26" x2="48" y2="26" stroke="#d1d5db" strokeWidth="2" />
                <line x1="16" y1="34" x2="36" y2="34" stroke="#d1d5db" strokeWidth="2" />
              </svg>
              <p className={styles.emptyTitle}>No applications yet</p>
              <p className={styles.emptyDesc}>
                Submit a new application to start the building height consultation process.
              </p>
              <button className={styles.newAppBtn} onClick={() => navigate('/submit')}>
                Submit Your First Application
              </button>
            </div>
          ) : (
            <div className={styles.cardList}>
              {submissions.map((sub) => {
                const cfg = STATUS_STYLE[sub.status] ?? STATUS_STYLE['Submitted']
                return (
                  <div key={sub.id} className={styles.appCard}>
                    <div className={styles.cardTop}>
                      <div>
                        <h3 className={styles.cardBuilding}>{sub.buildingName}</h3>
                        <p className={styles.cardAddress}>{sub.address}</p>
                      </div>
                      <span
                        className={styles.statusBadge}
                        style={{ color: cfg.color, background: cfg.bg }}
                      >
                        {sub.status}
                      </span>
                    </div>
                    <div className={styles.cardMeta}>
                      <span className={styles.metaItem}>
                        <strong>Application ID:</strong> {sub.id}
                      </span>
                      <span className={styles.metaItem}>
                        <strong>Submitted:</strong> {formatDate(sub.submittedAt)}
                      </span>
                      <span className={styles.metaItem}>
                        <strong>File:</strong> {sub.fileName} ({formatFileSize(sub.fileSize)})
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
