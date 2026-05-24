import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { DashboardHeader } from './DashboardHeader'
import { addSubmission, generateApplicationId } from '../../lib/submissionStore'
import styles from './SubmissionForm.module.css'

const MAX_FILE_BYTES = 100 * 1024 * 1024 // 100 MB

interface FormErrors {
  buildingName?: string
  address?: string
  applicantName?: string
  applicantEmail?: string
  file?: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function SubmissionForm() {
  const auth = useAuth()
  const navigate = useNavigate()

  const userEmail = (auth.user?.profile.email ?? '') as string
  const userName = (auth.user?.profile.name ?? '') as string
  const appRef = useState(() => generateApplicationId())[0]

  const [buildingName, setBuildingName] = useState('')
  const [address, setAddress] = useState('')
  const [applicantName, setApplicantName] = useState(userName)
  const [applicantEmail, setApplicantEmail] = useState(userEmail)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function validate(): FormErrors {
    const e: FormErrors = {}
    if (!buildingName.trim()) e.buildingName = 'Building name is required.'
    if (!address.trim()) e.address = 'Address is required.'
    if (!applicantName.trim()) e.applicantName = 'Applicant name is required.'
    if (!applicantEmail.trim()) e.applicantEmail = 'Email is required.'
    if (!selectedFile) {
      e.file = 'Please upload the BIM package (.zip).'
    } else if (!selectedFile.name.toLowerCase().endsWith('.zip')) {
      e.file = 'File must be a .zip archive.'
    } else if (selectedFile.size > MAX_FILE_BYTES) {
      e.file = `File size must not exceed 100 MB (selected: ${formatFileSize(selectedFile.size)}).`
    }
    return e
  }

  function handleFileSelect(file: File | null) {
    if (!file) return
    setSelectedFile(file)
    setErrors((prev) => ({ ...prev, file: undefined }))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0] ?? null
    handleFileSelect(file)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    addSubmission({
      id: appRef,
      buildingName: buildingName.trim(),
      address: address.trim(),
      submitterName: applicantName.trim(),
      submitterEmail: applicantEmail.trim().toLowerCase(),
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      fileName: selectedFile!.name,
      fileSize: selectedFile!.size,
    })

    navigate('/dashboard')
  }

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

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* Application Reference */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Application Reference</label>
            <input
              className={styles.input}
              type="text"
              value={appRef}
              readOnly
              aria-readonly="true"
            />
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
            {errors.buildingName && (
              <span className={styles.errorMsg}>{errors.buildingName}</span>
            )}
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
            <label className={styles.label}>
              BIM Package (.zip) <span className={styles.required}>*</span>
            </label>
            <div
              className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''} ${errors.file ? styles.dropZoneError : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              aria-label="Upload BIM zip file"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className={styles.hiddenInput}
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />
              {selectedFile ? (
                <div className={styles.fileSelected}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#0079c1" aria-hidden="true">
                    <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
                  </svg>
                  <div>
                    <p className={styles.fileName}>{selectedFile.name}</p>
                    <p className={styles.fileSize}>{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    type="button"
                    className={styles.removeFile}
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                    aria-label="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className={styles.dropPrompt}>
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="#9ca3af" aria-hidden="true">
                    <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                  </svg>
                  <p className={styles.dropText}>
                    Drag &amp; drop your .zip file here, or <span className={styles.dropLink}>browse</span>
                  </p>
                  <p className={styles.dropHint}>Maximum file size: 100 MB</p>
                </div>
              )}
            </div>
            {errors.file && <span className={styles.errorMsg}>{errors.file}</span>}

            <div className={styles.requirementBox}>
              <p className={styles.requirementTitle}>Required files inside the zip:</p>
              <ul className={styles.requirementList}>
                <li><code>.ifc</code> — IFC+SG BIM model file</li>
                <li><code>.prj</code> — Projection / coordinate reference file</li>
                <li><code>.wld3</code> — World file for 3D georeferencing</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              Submit Application
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
