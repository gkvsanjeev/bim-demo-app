import { useCallback, useState, type ReactNode } from 'react'
import styles from './AssessmentPanel.module.css'

interface AssessmentPanelProps {
  onClose: () => void
}

type AssessmentKey = 'composite_height_template' | 'ols_intersection' | 'ils_technical_template' | 'gfa' | 'radar'

interface AssessmentOption {
  key: AssessmentKey
  label: string
  hint: string
}

const ASSESSMENTS: AssessmentOption[] = [
  {
    key: 'composite_height_template',
    label: 'Height Analysis',
    hint: 'Composite Height Template intersection check',
  },
  {
    key: 'gfa',
    label: 'Gross Floor Area (GFA)',
    hint: 'GFA limit compliance check',
  },
  {
    key: 'ols_intersection',
    label: 'OLS Intersection',
    hint: 'Obstacle Limitation Surface intersection check',
  },
  {
    key: 'ils_technical_template',
    label: 'ILS Technical Analysis',
    hint: 'Instrument Landing System template impact check',
  },
  {
    key: 'radar',
    label: 'Radar Analysis',
    hint: 'Radar line-of-sight and façade reflectivity check',
  },
]

interface ShellExtraction {
  status: string
  element_count: number
  vertex_count: number
  triangle_count: number
}

interface HeightAnalysis {
  elevation_m_local: number
  min_z_m: number
  max_z_m: number
  height_m: number
}

interface GFA {
  gfa_m2: number
}

interface FacadeMaterial {
  name: string
  element_count: number
}

interface FacadeMaterials {
  unique_material_count: number
  materials: FacadeMaterial[]
}

interface StageError {
  stage: string
  detail: string
}

interface AnalysisResult {
  application_ref: string
  ifc_filename: string
  shell_extraction: ShellExtraction
  height_analysis: HeightAnalysis
  gfa: GFA
  facade_materials?: FacadeMaterials
  assessments_run: Record<AssessmentKey, boolean>
  pdf_url: string
  errors: StageError[]
}

type PanelStatus = 'idle' | 'loading' | 'done' | 'error'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

// ─── FormAccordion (Application Reference fields) ─────────────────────────────
function FormAccordion({
  title,
  summaryValue,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  summaryValue?: string
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className={`${styles.formAccordion} ${isOpen ? styles.formAccordionOpen : ''}`}>
      <button
        type="button"
        className={styles.formAccordionHeader}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className={styles.formAccordionHeaderContent}>
          <span className={styles.formAccordionTitle}>{title}</span>
          {!isOpen && summaryValue && (
            <span className={styles.formAccordionSummary}>{summaryValue}</span>
          )}
        </div>
        <span className={styles.formChevron}>›</span>
      </button>
      <div className={styles.formAccordionBody}>
        <div className={styles.formAccordionContent}>{children}</div>
      </div>
    </div>
  )
}

// ─── AccordionSection (top-level result cards) ────────────────────────────────
function AccordionSection({
  icon,
  title,
  badge,
  isOpen,
  onToggle,
  accentColor = '#0079c1',
  children,
}: {
  icon: string
  title: string
  badge: ReactNode
  isOpen: boolean
  onToggle: () => void
  accentColor?: string
  children: ReactNode
}) {
  return (
    <div className={`${styles.accordion} ${isOpen ? styles.accordionOpen : ''}`}>
      <button
        type="button"
        className={styles.accordionHeader}
        style={{ borderLeftColor: accentColor }}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className={styles.accordionIcon} style={{ color: accentColor }}>
          {icon}
        </span>
        <span className={styles.accordionTitle}>{title}</span>
        <span className={styles.accordionBadgeSlot}>{badge}</span>
        <span className={styles.chevron}>›</span>
      </button>
      <div className={styles.accordionBody}>
        <div className={styles.accordionContent}>{children}</div>
      </div>
    </div>
  )
}

// ─── StatRow ──────────────────────────────────────────────────────────────────
function StatRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={`${styles.statRow} ${highlight ? styles.statRowHighlight : ''}`}>
      <span className={styles.statLabel}>{label}</span>
      <span className={`${styles.statValue} ${highlight ? styles.statValueHighlight : ''}`}>
        {value}
      </span>
    </div>
  )
}

// ─── AssessmentPanel ──────────────────────────────────────────────────────────
export function AssessmentPanel({ onClose }: AssessmentPanelProps) {
  const [appRef, setAppRef] = useState('CAAS-20260524-JUG5P')
  const [ifcFilename, setIfcFilename] = useState('ZHA-B-BWK-C-MR-R18.ifc')
  const [selected, setSelected] = useState<Record<AssessmentKey, boolean>>({
    composite_height_template: true,
    ols_intersection: true,
    ils_technical_template: true,
    gfa: true,
    radar: true,
  })
  const [panelStatus, setPanelStatus] = useState<PanelStatus>('idle')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [fetchError, setFetchError] = useState('')
  const [appRefOpen, setAppRefOpen] = useState(false)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

  const handleToggle = useCallback((key: AssessmentKey) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }, [])

  const handleSubmit = useCallback(async () => {
    setPanelStatus('loading')
    setResult(null)
    setFetchError('')

    try {
      const res = await fetch(`${API_BASE}/processing/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_ref: appRef.trim(),
          ifc_filename: ifcFilename.trim(),
          assessments: selected,
        }),
      })

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status} ${res.statusText}`)
      }

      const data = (await res.json()) as AnalysisResult
      setResult(data)
      setPanelStatus('done')
      setOpenSections(new Set())
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'An unexpected error occurred.')
      setPanelStatus('error')
    }
  }, [appRef, ifcFilename, selected])

  const handleViewReport = useCallback(() => {
    if (!result) return
    window.open(`${API_BASE}${result.pdf_url}`, '_blank', 'noopener,noreferrer')
  }, [result])

  const anySelected = Object.values(selected).some(Boolean)

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Select Assessments</span>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close assessment panel">
          ✕
        </button>
      </div>

      <div className={styles.body}>
        {/* ─── Application Reference accordion (collapsed by default) ── */}
        <FormAccordion
          title="Application Reference"
          summaryValue={appRef || undefined}
          isOpen={appRefOpen}
          onToggle={() => setAppRefOpen((prev) => !prev)}
        >
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="assessAppRef">
              Application Reference
            </label>
            <input
              id="assessAppRef"
              type="text"
              className={styles.textInput}
              value={appRef}
              onChange={(e) => setAppRef(e.target.value)}
              placeholder="e.g. APP-003"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="assessIfc">
              IFC Filename
            </label>
            <input
              id="assessIfc"
              type="text"
              className={styles.textInput}
              value={ifcFilename}
              onChange={(e) => setIfcFilename(e.target.value)}
              placeholder="e.g. building.ifc"
            />
          </div>
        </FormAccordion>

        {/* ─── Assessment checkboxes ───────────────────────── */}
        <div className={styles.sectionLabel}>Assessments</div>

        <div className={styles.checkboxList}>
          {ASSESSMENTS.map((opt) => (
            <label key={opt.key} className={styles.checkboxRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selected[opt.key]}
                onChange={() => handleToggle(opt.key)}
              />
              <div className={styles.checkboxText}>
                <span className={styles.checkboxLabel}>{opt.label}</span>
                <span className={styles.checkboxHint}>{opt.hint}</span>
              </div>
            </label>
          ))}
        </div>

        {/* ─── Submit ──────────────────────────────────────── */}
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={panelStatus === 'loading' || !anySelected}
        >
          {panelStatus === 'loading' ? 'Running Analysis…' : 'Run Analysis'}
        </button>

        {/* ─── Error state ─────────────────────────────────── */}
        {panelStatus === 'error' && (
          <div className={styles.errorBox}>
            <span className={styles.errorTitle}>Request failed</span>
            <span className={styles.errorDetail}>{fetchError}</span>
          </div>
        )}

        {/* ─── Result accordions ────────────────────────────── */}
        {panelStatus === 'done' && result && (
          <div className={styles.resultSection}>
            {/* Summary strip */}
            <div className={styles.resultSummaryHeader}>
              <div className={styles.resultSummaryRow}>
                <span className={styles.resultSummaryLabel}>Ref</span>
                <span className={styles.resultSummaryValue}>{result.application_ref}</span>
              </div>
              <div className={styles.resultSummaryRow}>
                <span className={styles.resultSummaryLabel}>File</span>
                <span className={styles.resultSummaryValue} title={result.ifc_filename}>
                  {result.ifc_filename.length > 26
                    ? `…${result.ifc_filename.slice(-24)}`
                    : result.ifc_filename}
                </span>
              </div>
            </div>

            {/* Pipeline errors */}
            {result.errors.length > 0 && (
              <div className={styles.pipelineErrors}>
                {result.errors.map((e, i) => (
                  <div key={i} className={styles.pipelineError}>
                    <span className={styles.errorStage}>{e.stage}</span>: {e.detail}
                  </div>
                ))}
              </div>
            )}

            <div className={styles.accordionList}>
              {/* Shell Extraction */}
              <AccordionSection
                icon="◈"
                title="Shell Extraction"
                badge={
                  <span
                    className={
                      result.shell_extraction.status === 'ok' ? styles.badgeOk : styles.badgeError
                    }
                  >
                    {result.shell_extraction.status === 'ok' ? 'OK' : 'FAILED'}
                  </span>
                }
                isOpen={openSections.has('shell_extraction')}
                onToggle={() => toggleSection('shell_extraction')}
                accentColor="#0079c1"
              >
                <div className={styles.statGrid}>
                  <StatRow
                    label="Elements"
                    value={result.shell_extraction.element_count.toLocaleString()}
                  />
                  <StatRow
                    label="Vertices"
                    value={result.shell_extraction.vertex_count.toLocaleString()}
                  />
                  <StatRow
                    label="Triangles"
                    value={result.shell_extraction.triangle_count.toLocaleString()}
                  />
                </div>
              </AccordionSection>

              {/* Height Analysis */}
              <AccordionSection
                icon="↕"
                title="Height Analysis"
                badge={
                  <span className={styles.badgeMetric}>
                    {result.height_analysis.height_m.toFixed(1)} m
                  </span>
                }
                isOpen={openSections.has('height_analysis')}
                onToggle={() => toggleSection('height_analysis')}
                accentColor="#00897b"
              >
                <div className={styles.statGrid}>
                  <StatRow
                    label="Building Height"
                    value={`${result.height_analysis.height_m.toFixed(2)} m`}
                    highlight
                  />
                  <StatRow label="Max Elevation" value={`${result.height_analysis.max_z_m.toFixed(2)} m`} />
                  <StatRow label="Min Elevation" value={`${result.height_analysis.min_z_m.toFixed(2)} m`} />
                  <StatRow
                    label="Local Elevation"
                    value={`${result.height_analysis.elevation_m_local.toFixed(2)} m`}
                  />
                </div>
              </AccordionSection>

              {/* Gross Floor Area */}
              <AccordionSection
                icon="⊞"
                title="Gross Floor Area"
                badge={
                  <span className={styles.badgeMetric}>
                    {(result.gfa.gfa_m2 / 1000).toFixed(1)}k m²
                  </span>
                }
                isOpen={openSections.has('gfa')}
                onToggle={() => toggleSection('gfa')}
                accentColor="#6a1b9a"
              >
                <div className={styles.gfaDisplay}>
                  <span className={styles.gfaValue}>
                    {result.gfa.gfa_m2.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </span>
                  <span className={styles.gfaUnit}>m²</span>
                  <span className={styles.gfaLabel}>Gross Floor Area</span>
                </div>
              </AccordionSection>

              {/* Facade Materials (optional field) */}
              {result.facade_materials && (
                <AccordionSection
                  icon="◉"
                  title="Facade Materials"
                  badge={
                    <span className={styles.badgeCount}>
                      {result.facade_materials.unique_material_count} types
                    </span>
                  }
                  isOpen={openSections.has('facade_materials')}
                  onToggle={() => toggleSection('facade_materials')}
                  accentColor="#e65100"
                >
                  <div className={styles.materialList}>
                    {result.facade_materials.materials.map((m, i) => (
                      <div key={i} className={styles.materialRow}>
                        <span className={styles.materialName} title={m.name}>
                          {m.name}
                        </span>
                        <span className={styles.materialCount}>
                          {m.element_count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </AccordionSection>
              )}

            </div>

            <button className={styles.viewReportBtn} onClick={handleViewReport}>
              View PDF Report
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
