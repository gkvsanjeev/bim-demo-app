import { useState } from 'react'
import '@esri/calcite-components/components/calcite-icon'
import { SearchPanel } from './SearchPanel'
import { LayersPanel } from './LayersPanel'
import { SceneToolsPanel } from './SceneToolsPanel'
import { RadarViewshedPanel } from './RadarViewshedPanel'
import styles from './RightToolbar.module.css'

type ToolId = 'search' | 'layers' | 'basemap' | 'coordinates' | 'daylight' | 'scene-tools' | 'radar-viewshed' | 'building-explorer'

interface RightToolbarProps {
  sceneRef: React.RefObject<any> // FIXME(arcgis): arcgis-scene element type not exported
  isBasemapOpen: boolean
  onBasemapToggle: () => void
  isBuildingExplorerOpen: boolean
  onBuildingExplorerToggle: () => void
  isCoordinatesOpen: boolean
  onCoordinatesToggle: () => void
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

function BasemapIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function CoordinatesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Crosshair / reticle — represents a pointer-position readout */}
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function DaylightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function SceneToolsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function RadarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      {/* Concentric arcs representing a radar sweep */}
      <path d="M5.64 5.64A9 9 0 0 0 3 12" />
      <path d="M18.36 5.64A9 9 0 0 1 21 12" />
      <path d="M8.46 8.46A5 5 0 0 0 7 12" />
      <path d="M15.54 8.46A5 5 0 0 1 17 12" />
      {/* Observer dot */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      {/* Mast */}
      <line x1="12" y1="13.5" x2="12" y2="21" />
    </svg>
  )
}

const TOOLS: { id: ToolId; label: string; icon: React.ReactNode }[] = [
  { id: 'search', label: 'Search', icon: <SearchIcon /> },
  { id: 'layers', label: 'Layers', icon: <LayersIcon /> },
  { id: 'basemap', label: 'Basemap', icon: <BasemapIcon /> },
  { id: 'coordinates', label: 'Coordinates', icon: <CoordinatesIcon /> },
  { id: 'daylight', label: 'Daylight', icon: <DaylightIcon /> },
  { id: 'scene-tools', label: 'Scene tools', icon: <SceneToolsIcon /> },
  { id: 'radar-viewshed', label: 'Radar viewshed', icon: <RadarIcon /> },
  { id: 'building-explorer', label: 'Building explorer', icon: <calcite-icon icon="relative-to-scene-elevation" scale="s" /> },
]

function DaylightPanelInline({ onClose }: { onClose: () => void }) {
  const [hour, setHour] = useState(12)
  return (
    <div className={styles.daylightPanel}>
      <div className={styles.daylightHeader}>
        <span className={styles.daylightTitle}>Daylight</span>
        <button className={styles.daylightClose} onClick={onClose} aria-label="Close daylight">✕</button>
      </div>
      <div className={styles.daylightBody}>
        <label className={styles.daylightLabel}>
          Time of day
          <span className={styles.daylightTime}>{String(hour).padStart(2, '0')}:00</span>
        </label>
        <input
          type="range"
          min={0}
          max={23}
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          className={styles.daylightSlider}
        />
        <div className={styles.daylightTicks}>
          <span>00:00</span>
          <span>12:00</span>
          <span>23:00</span>
        </div>
      </div>
    </div>
  )
}

export function RightToolbar({ sceneRef, isBasemapOpen, onBasemapToggle, isBuildingExplorerOpen, onBuildingExplorerToggle, isCoordinatesOpen, onCoordinatesToggle }: RightToolbarProps) {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null)

  const handleToolClick = (toolId: ToolId) => {
    if (toolId === 'basemap') {
      setActiveTool(null)
      onBasemapToggle()
      return
    }
    if (toolId === 'building-explorer') {
      setActiveTool(null)
      onBuildingExplorerToggle()
      return
    }
    if (toolId === 'coordinates') {
      setActiveTool(null)
      onCoordinatesToggle()
      return
    }
    if (isBasemapOpen) onBasemapToggle()
    setActiveTool((prev) => (prev === toolId ? null : toolId))
  }

  const handleClose = () => setActiveTool(null)

  const isActive = (toolId: ToolId) => {
    if (toolId === 'basemap') return isBasemapOpen
    if (toolId === 'building-explorer') return isBuildingExplorerOpen
    if (toolId === 'coordinates') return isCoordinatesOpen
    return activeTool === toolId
  }

  return (
    <div className={styles.toolbar}>
      {activeTool && (
        <div className={styles.panel}>
          {activeTool === 'search' && <SearchPanel onClose={handleClose} />}
          {activeTool === 'layers' && <LayersPanel sceneRef={sceneRef} onClose={handleClose} />}
          {activeTool === 'daylight' && <DaylightPanelInline onClose={handleClose} />}
          {activeTool === 'scene-tools' && (
            <SceneToolsPanel sceneRef={sceneRef} onClose={handleClose} />
          )}
          {activeTool === 'radar-viewshed' && (
            <RadarViewshedPanel sceneRef={sceneRef} onClose={handleClose} />
          )}
        </div>
      )}

      <div className={styles.iconStrip}>
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={`${styles.iconBtn} ${isActive(tool.id) ? styles.iconBtnActive : ''}`}
            onClick={() => handleToolClick(tool.id)}
            data-tooltip={tool.label}
            aria-label={tool.label}
            aria-pressed={isActive(tool.id)}
          >
            {tool.icon}
          </button>
        ))}
      </div>
    </div>
  )
}
