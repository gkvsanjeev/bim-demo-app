import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { DashboardHeader } from './DashboardHeader'
import { fetchAllSubmissions } from '../../lib/api'
import { ROLE_LABELS, getPrimaryRole } from '../../config/auth'
import type { Submission } from '../../types/submission'
import styles from './CaasDashboard.module.css'

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  Submitted: { color: '#0079c1', bg: '#e6f3fb' },
  'Under Review': { color: '#c46000', bg: '#fef3e2' },
  Approved: { color: '#2e7d32', bg: '#e8f5e9' },
  Returned: { color: '#c62828', bg: '#fce8e6' },
}

type FilterStatus = 'All' | 'Submitted' | 'Under Review' | 'Approved' | 'Returned'

function formatDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yy} ${hh}:${min}`
}

export function CaasDashboard() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filter, setFilter] = useState<FilterStatus>('All')
  const [search, setSearch] = useState('')

  const role = getPrimaryRole(auth.user)
  const roleLabel = role ? ROLE_LABELS[role] : ''

  useEffect(() => {
    fetchAllSubmissions()
      .then((data) => setSubmissions(data))
      .catch(console.error)
  }, [])

  const filtered = useMemo(
    () =>
      submissions.filter((s) => {
        const matchesFilter = filter === 'All' || s.status === filter
        const q = search.toLowerCase()
        const matchesSearch =
          !q ||
          s.id.toLowerCase().includes(q) ||
          s.buildingName.toLowerCase().includes(q) ||
          s.submitterName.toLowerCase().includes(q)
        return matchesFilter && matchesSearch
      }),
    [submissions, filter, search],
  )

  const counts: Record<FilterStatus, number> = {
    All: submissions.length,
    Submitted: submissions.filter((s) => s.status === 'Submitted').length,
    'Under Review': submissions.filter((s) => s.status === 'Under Review').length,
    Approved: submissions.filter((s) => s.status === 'Approved').length,
    Returned: submissions.filter((s) => s.status === 'Returned').length,
  }

  return (
    <div className={styles.page}>
      <DashboardHeader />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Applications Dashboard</h1>
            <p className={styles.pageSub}>
              {roleLabel} · {submissions.length} application{submissions.length !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className={styles.statsRow}>
          {(['All', 'Submitted', 'Under Review', 'Approved', 'Returned'] as FilterStatus[]).map((s) => {
            const cfg = s === 'All' ? null : STATUS_STYLE[s]
            return (
              <button
                key={s}
                className={`${styles.statBtn} ${filter === s ? styles.statBtnActive : ''}`}
                onClick={() => setFilter(s)}
                style={filter === s && cfg ? { borderColor: cfg.color, color: cfg.color } : undefined}
              >
                <span className={styles.statCount}>{counts[s]}</span>
                <span className={styles.statLabel}>{s}</span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by ID, building name, or applicant…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Application ID</th>
                <th>Building Name</th>
                <th>Address</th>
                <th>Submitted By</th>
                <th>Submitted Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    No applications match your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => {
                  const cfg = STATUS_STYLE[sub.status] ?? STATUS_STYLE['Submitted']
                  return (
                    <tr key={sub.id} className={styles.row}>
                      <td className={styles.idCell}>{sub.id}</td>
                      <td className={styles.nameCell}>{sub.buildingName}</td>
                      <td className={styles.addressCell}>{sub.address}</td>
                      <td>
                        <div className={styles.submitter}>{sub.submitterName}</div>
                        <div className={styles.submitterEmail}>{sub.submitterEmail}</div>
                      </td>
                      <td className={styles.dateCell}>{formatDate(sub.submittedAt)}</td>
                      <td>
                        <span
                          className={styles.statusBadge}
                          style={{ color: cfg.color, background: cfg.bg }}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.viewBtn}
                          onClick={() => navigate(`/map/${sub.id}`)}
                        >
                          View in Map
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
