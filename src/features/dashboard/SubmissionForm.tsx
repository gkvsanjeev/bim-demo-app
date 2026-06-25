import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import JSZip from 'jszip'
import { DashboardHeader } from './DashboardHeader'
import { generateApplicationId } from '../../lib/submissionStore'
import { createSubmission } from '../../lib/api'
import styles from './SubmissionForm.module.css'

const MAX_FILE_BYTES = 100 * 1024 * 1024 // 100 MB

interface FormErrors {
  buildingName?: string
  address?: string
  applicantName?: string
  applicantEmail?: string
  file?: string
  submit?: string
}

type FileState =
  | { status: 'none' }
  | { status: 'validating'; name: string }
  | { status: 'invalid'; name: string; reason: string }
  | { status: 'valid'; file: File; ifcBase: string }

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function validateZipContents(file: File): Promise<string | null> {
  try {
    const zip = await JSZip.loadAsync(file)
    const entries = Object.values(zip.files).filter((f) => !f.dir)
    const names = entries.map((f) => {
      const parts = f.name.split('/')
      return parts[parts.length - 1].toLowerCase()
    })

    const ifcName = names.find((n) => n.endsWith('.ifc'))
    if (!ifcName) return 'The zip must contain an .ifc file.'

    const base = ifcName.slice(0, -4)
    if (!names.includes(`${base}.prj`))
      return `Missing required file: ${base}.prj`
    if (!names.includes(`${base}.wld3`))
      return `Missing required file: ${base}.wld3`

    return null
  } catch {
    return 'Could not read the zip. Ensure it is a valid .zip archive.'
  }
}

async function uploadFile(file: File): Promise<string> {
  const res = await fetch('/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-Filename': file.name,
    },
    body: file,
  })
  if (!res.ok) throw new Error(`Upload failed (HTTP ${res.status})`)
  const json = (await res.json()) as { path: string }
  return json.path
}

export function SubmissionForm() {
  const auth = useAuth()
  const navigate = useNavigate()

  const userEmail = (auth.user?.profile.email ?? '') as string
  const userName = (auth.user?.profile.name ?? '') as string
  const [appRef] = useState(() => generateApplicationId())

  const [buildingName, setBuildingName] = useState('')
  const [address, setAddress] = useState('')
  const [applicantName, setApplicantName] = useState(userName)
  const [applicantEmail, setApplicantEmail] = useState(userEmail)
  const [fileState, setFileState] = useState<FileState>({ status: 'none' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleFileSelect(file: File | null) {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setFileState({ status: 'invalid', name: file.name, reason: 'File must be a .zip archive.' })
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileState({
        status: 'invalid',
        name: file.name,
        reason: `File exceeds 100 MB (${formatFileSize(file.size)}).`,
      })
      return
    }

    setFileState({ status: 'validating', name: file.name })
    setErrors((prev) => ({ ...prev, file: undefined }))

    const error = await validateZipContents(file)
    if (error) {
      setFileState({ status: 'invalid', name: file.name, reason: error })
    } else {
      // Extract the ifc base name for display
      const zip = await JSZip.loadAsync(file)
      const ifcEntry = Object.values(zip.files).find(
        (f) => !f.dir && f.name.toLowerCase().endsWith('.ifc'),
      )
      const ifcBase = ifcEntry
        ? ifcEntry.name.split('/').pop()!.slice(0, -4)
        : file.name.replace(/\.zip$/i, '')
      setFileState({ status: 'valid', file, ifcBase })
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    void handleFileSelect(e.dataTransfer.files[0] ?? null)
  }

  function validateFields(): FormErrors {
    const e: FormErrors = {}
    if (!buildingName.trim()) e.buildingName = 'Building name is required.'
    if (!address.trim()) e.address = 'Address is required.'
    if (!applicantName.trim()) e.applicantName = 'Applicant name is required.'
    if (!applicantEmail.trim()) e.applicantEmail = 'Email is required.'
    if (fileState.status !== 'valid') e.file = 'Please upload a valid BIM package (.zip).'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateFields()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    if (fileState.status !== 'valid') return

    setIsSubmitting(true)
    setErrors({})

    let filePath = ''
    try {
      filePath = await uploadFile(fileState.file)
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Upload failed. Try again.' })
      setIsSubmitting(false)
      return
    }

    try {
      await createSubmission({
        id: appRef,
        building_name: buildingName.trim(),
        address: address.trim(),
        keycloak_id: auth.user!.profile.sub,
        file_name: fileState.file.name,
        file_size: fileState.file.size,
        file_path: filePath,
      })
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Submission failed. Try again.' })
      setIsSubmitting(false)
      return
    }

    navigate('/dashboard')
  }

  const fileValid = fileState.status === 'valid'
  const fileInvalid = fileState.status === 'invalid'

  return (
    <div className={styles.page}>
      <DashboardHeader />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1 className={styles.pageTitle}>New Building Height Application</h1>
          <p className={styles.pageSub}>
            Submit your IFC+SG BIM package for CAAS aviation safety review.
          </p>
        </div>

        <form className={styles.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
          {/* Application Reference */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Application Reference</label>
            <input className={styles.input} type="text" value={appRef} readOnly aria-readonly="true" />
            <span className={styles.hint}>Auto-generated — keep this for your records.</span>
          </div>

          {/* Building Name */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="buildingName">
              Building Name <span className={styles.required}>*</span>
            </label>
            <input
              id="buildingName"
              className={`${styles.input} ${errors.buildingName ? styles.inputError : ''}`}
              type="text"
              value={buildingName}
              onChange={(e) => {
                setBuildingName(e.target.value)
                setErrors((prev) => ({ ...prev, buildingName: undefined }))
              }}
              placeholder="e.g. Changi Business Park Tower 3"
            />
            {errors.buildingName && <span className={styles.errorMsg}>{errors.buildingName}</span>}
          </div>

          {/* Address */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="address">
              Building Address <span className={styles.required}>*</span>
            </label>
            <input
              id="address"
              className={`${styles.input} ${errors.address ? styles.inputError : ''}`}
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value)
                setErrors((prev) => ({ ...prev, address: undefined }))
              }}
              placeholder="e.g. 10 Changi Business Park Central 2, Singapore 486030"
            />
            {errors.address && <span className={styles.errorMsg}>{errors.address}</span>}
          </div>

          <div className={styles.twoCol}>
            {/* Applicant Name */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="applicantName">
                Applicant Name <span className={styles.required}>*</span>
              </label>
              <input
                id="applicantName"
                className={`${styles.input} ${errors.applicantName ? styles.inputError : ''}`}
                type="text"
                value={applicantName}
                onChange={(e) => {
                  setApplicantName(e.target.value)
                  setErrors((prev) => ({ ...prev, applicantName: undefined }))
                }}
              />
              {errors.applicantName && (
                <span className={styles.errorMsg}>{errors.applicantName}</span>
              )}
            </div>

            {/* Applicant Email */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="applicantEmail">
                Email Address <span className={styles.required}>*</span>
              </label>
              <input
                id="applicantEmail"
                className={`${styles.input} ${errors.applicantEmail ? styles.inputError : ''}`}
                type="email"
                value={applicantEmail}
                onChange={(e) => {
                  setApplicantEmail(e.target.value)
                  setErrors((prev) => ({ ...prev, applicantEmail: undefined }))
                }}
              />
              {errors.applicantEmail && (
                <span className={styles.errorMsg}>{errors.applicantEmail}</span>
              )}
            </div>
          </div>

          {/* BIM Package Upload */}
          <div className={styles.fieldGroup}>
            <span className={styles.label}>
              BIM Package (.zip) <span className={styles.required}>*</span>
            </span>

            {/*
              Using <label> as the drop zone makes the entire area natively trigger
              the file dialog on click — no JavaScript click() needed, works in all browsers.
            */}
            <label
              htmlFor="bim-upload"
              className={[
                styles.dropZone,
                isDragging ? styles.dropZoneActive : '',
                fileValid ? styles.dropZoneValid : '',
                (fileInvalid || errors.file) ? styles.dropZoneError : '',
              ].join(' ')}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                id="bim-upload"
                type="file"
                accept=".zip"
                className={styles.hiddenInput}
                onChange={(e) => void handleFileSelect(e.target.files?.[0] ?? null)}
                // Reset value so the same file can be re-selected after removal
                onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
              />

              {fileState.status === 'validating' && (
                <div className={styles.dropPrompt}>
                  <div className={styles.spinner} aria-label="Validating" />
                  <p className={styles.dropText}>Validating <strong>{fileState.name}</strong>…</p>
                </div>
              )}

              {fileState.status === 'valid' && (
                <div className={styles.fileSelected}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="#2e7d32" aria-hidden="true">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  <div className={styles.fileInfo}>
                    <p className={styles.fileName}>{fileState.file.name}</p>
                    <p className={styles.fileSize}>
                      {formatFileSize(fileState.file.size)} · IFC base: <strong>{fileState.ifcBase}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.removeFile}
                    onClick={(e) => {
                      e.preventDefault()  // stops label from re-opening dialog
                      e.stopPropagation()
                      setFileState({ status: 'none' })
                    }}
                    aria-label="Remove file"
                  >
                    ✕
                  </button>
                </div>
              )}

              {fileState.status === 'invalid' && (
                <div className={styles.fileSelected}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="#c62828" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <div className={styles.fileInfo}>
                    <p className={styles.fileName}>{fileState.name}</p>
                    <p className={styles.fileInvalidReason}>{fileState.reason}</p>
                  </div>
                  <button
                    type="button"
                    className={styles.removeFile}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setFileState({ status: 'none' })
                    }}
                    aria-label="Remove file"
                  >
                    ✕
                  </button>
                </div>
              )}

              {fileState.status === 'none' && (
                <div className={styles.dropPrompt}>
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="#9ca3af" aria-hidden="true">
                    <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                  </svg>
                  <p className={styles.dropText}>
                    Drag &amp; drop your .zip file here, or{' '}
                    <span className={styles.dropLink}>Browse</span>
                  </p>
                  <p className={styles.dropHint}>Maximum file size: 100 MB</p>
                </div>
              )}
            </label>

            {errors.file && <span className={styles.errorMsg}>{errors.file}</span>}

            <div className={styles.requirementBox}>
              <p className={styles.requirementTitle}>Required files inside the zip (same base name):</p>
              <ul className={styles.requirementList}>
                <li><code>building.ifc</code> — IFC+SG BIM model file</li>
                <li><code>building.prj</code> — Projection / coordinate reference file</li>
                <li><code>building.wld3</code> — World file for 3D georeferencing</li>
              </ul>
            </div>
          </div>

          {/* Submit error */}
          {errors.submit && (
            <p className={styles.submitError}>{errors.submit}</p>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate('/dashboard')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || fileState.status === 'validating'}
            >
              {isSubmitting ? 'Uploading…' : 'Submit Application'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
