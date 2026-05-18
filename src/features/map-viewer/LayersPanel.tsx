import { useEffect, useRef, useState } from 'react'
import styles from './LayersPanel.module.css'

interface LayersPanelProps {
  sceneRef: React.RefObject<any>
  onClose: () => void
}

export function LayersPanel({ sceneRef, onClose }: LayersPanelProps) {
  const [activeTab, setActiveTab] = useState<'layers' | 'legend'>('layers')
  const layerListRef = useRef<any>(null)
  const legendRef = useRef<any>(null)

  useEffect(() => {
    const sceneEl = sceneRef.current
    if (!sceneEl) return

    let cancelled = false

    sceneEl.viewOnReady().then((view: any) => {
      if (cancelled) return
      if (layerListRef.current) layerListRef.current.view = view
      if (legendRef.current) legendRef.current.view = view
    }).catch(console.error)

    return () => { cancelled = true }
  }, [sceneRef])

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'layers' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('layers')}
          >
            Layers
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'legend' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('legend')}
          >
            Legend
          </button>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close layers">
          ✕
        </button>
      </div>

      {/* Both widgets stay mounted so they initialise once; only visibility toggles on tab switch */}
      <div className={styles.widgetWrapper} style={{ display: activeTab === 'layers' ? 'block' : 'none' }}>
        <arcgis-layer-list
          ref={layerListRef}
          show-collapse-button={true}
          show-filter={true}
          filter-placeholder="Filter layers"
        />
      </div>

      <div className={styles.widgetWrapper} style={{ display: activeTab === 'legend' ? 'block' : 'none' }}>
        <arcgis-legend ref={legendRef} />
      </div>
    </div>
  )
}
