import { useState } from 'react'
import styles from './SearchPanel.module.css'

interface SearchPanelProps {
  onClose: () => void
}

export function SearchPanel({ onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('')

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Search</span>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close search">
          ✕
        </button>
      </div>
      <div className={styles.body}>
        <div className={styles.inputWrapper}>
          <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find address or place"
          />
        </div>
      </div>
    </div>
  )
}
