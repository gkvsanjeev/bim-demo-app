import { useEffect, useRef } from 'react'
import styles from './BasemapPanel.module.css'

interface BasemapPanelProps {
  sceneRef: React.RefObject<any>
  onClose: () => void
}

export function BasemapPanel({ sceneRef, onClose }: BasemapPanelProps) {
  const galleryRef = useRef<any>(null)

  useEffect(() => {
    const galleryEl = galleryRef.current
    const sceneEl = sceneRef.current
    if (!galleryEl || !sceneEl) return

    let cancelled = false

    sceneEl.viewOnReady().then((view: any) => {
      if (!cancelled) galleryEl.view = view
    }).catch(console.error)

    return () => { cancelled = true }
  }, [sceneRef])

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Basemap</span>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close basemap">
          ✕
        </button>
      </div>
      <div className={styles.galleryWrapper}>
        <arcgis-basemap-gallery ref={galleryRef} />
      </div>
    </div>
  )
}
