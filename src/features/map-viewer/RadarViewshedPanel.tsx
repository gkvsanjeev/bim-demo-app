import '@esri/calcite-components/components/calcite-button'
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './RadarViewshedPanel.module.css'

interface RadarViewshedPanelProps {
  sceneRef: React.RefObject<any> // FIXME(arcgis): arcgis-scene element type not exported
  onClose: () => void
}

type Status = 'loading' | 'ready' | 'generating-pdf'

// ASSUMPTION(US-25): radar target = centroid of the proposed building, provided
// by CAAS in WGS84. Used to keep each viewshed pointed at the building as the
// observer is dragged.
const RADAR_TARGET_LNG_LAT = { lng: -117.1970, lat: 34.0588, z: 393.1817 }

// Web Mercator y is distorted by latitude; cosh(y/R) is the scale factor at y.
const WEB_MERCATOR_R = 6378137

// Extra metres added past the target so the viewshed cone reaches just beyond
// the building rather than terminating on its near face.
const FAR_DISTANCE_PADDING_M = 50

// Radar dish marker: parabolic reflector (quadratic bezier bowing lower-left so
// the bowl opens upper-right) + aperture line + feed arm + focal point + mast + base.
// Inlined to avoid an extra asset fetch.
const SENSOR_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
  // mast
  '<line x1="14" y1="20" x2="14" y2="28" stroke="#c0392b" stroke-width="2.5" stroke-linecap="round"/>' +
  // base
  '<line x1="9" y1="28" x2="19" y2="28" stroke="#c0392b" stroke-width="2.5" stroke-linecap="round"/>' +
  // dish bowl — Q bezier bows toward lower-left so the concave side faces upper-right
  '<path d="M5 26 Q9 24 23 9" stroke="#c0392b" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
  // aperture (rim across the dish opening)
  '<line x1="5" y1="26" x2="23" y2="9" stroke="#c0392b" stroke-width="1.5" stroke-linecap="round"/>' +
  // feed arm from pivot to focal point
  '<line x1="14" y1="20" x2="18" y2="14" stroke="#c0392b" stroke-width="1.5" stroke-linecap="round"/>' +
  // focal point
  '<circle cx="18" cy="14" r="2.5" fill="#c0392b"/>' +
  '</svg>'
const SENSOR_ICON_DATA_URI =
  'data:image/svg+xml;utf8,' + encodeURIComponent(SENSOR_ICON_SVG)

function aimAtTarget(
  observer: { x: number; y: number; z: number },
  target: { x: number; y: number; z: number },
) {
  const dx = target.x - observer.x
  const dy = target.y - observer.y
  const dz = target.z - observer.z

  // Heading: clockwise from North. atan2(dx, dy) is the angle from +Y.
  let heading = (Math.atan2(dx, dy) * 180) / Math.PI
  if (heading < 0) heading += 360

  // Undistort horizontal Web Mercator distance to true ground metres.
  const yAvg = (observer.y + target.y) / 2
  const scale = Math.cosh(yAvg / WEB_MERCATOR_R)
  const dHoriz = Math.sqrt(dx * dx + dy * dy) / scale

  // Tilt: 0 = straight down, 90 = horizontal, 180 = straight up.
  const tilt = 90 + (Math.atan2(dz, dHoriz) * 180) / Math.PI

  // True 3D slant distance from observer to target, padded so the cone
  // extends just past the building.
  const farDistance = Math.sqrt(dHoriz * dHoriz + dz * dz) + FAR_DISTANCE_PADDING_M

  return { heading, tilt, farDistance }
}

/*
 * Follows the analysis-viewshed sample pattern:
 *   https://developers.arcgis.com/javascript/latest/sample-code/analysis-viewshed/
 *
 * Differences from the sample:
 *  - No separate "Place Viewshed" / "Cancel" buttons. The "Edit visible viewsheds"
 *    checkbox controls both: when checked, continuous place() is active AND
 *    existing viewsheds are draggable; when unchecked, place is aborted and
 *    interactivity is off.
 *  - No "Limit maximum field of view" toggle — once editing is on, the user can
 *    change the cone by dragging the handles.
 */
export function RadarViewshedPanel({ sceneRef, onClose }: RadarViewshedPanelProps) {
  const [status, setStatus] = useState<Status>('loading')
  const [pdfProgress, setPdfProgress] = useState('')
  const [isInteractive, setIsInteractive] = useState(false)
  const [viewshedCount, setViewshedCount] = useState(0)
  const [horizFov, setHorizFov] = useState(45)
  const [vertFov, setVertFov] = useState(15)
  const [farDist, setFarDist] = useState(0)

  const analysisRef = useRef<any>(null)        // FIXME(arcgis): ViewshedAnalysis type
  const analysisViewRef = useRef<any>(null)    // FIXME(arcgis): ViewshedAnalysisView3D type
  const abortRef = useRef<AbortController | null>(null)
  const isAbortErrorRef = useRef<((err: Error) => boolean) | null>(null)
  const changeHandleRef = useRef<{ remove: () => void } | null>(null)
  const aimHandleRef = useRef<{ remove: () => void } | null>(null)
  const observerGraphicRef = useRef<any>(null) // FIXME(arcgis): Graphic type
  const fovHandlesRef = useRef<Array<{ remove: () => void }>>([])      // FIXME(arcgis): WatchHandle type

  // ─── Setup: create ViewshedAnalysis on the SceneView ──────────────────────
  useEffect(() => {
    const sceneEl = sceneRef.current
    if (!sceneEl) return

    let cancelled = false

    const setup = async () => {
      const [
        { default: ViewshedAnalysis },
        { default: Viewshed },
        { default: SpatialReference },
        { default: Graphic },
        { default: Point },
        { default: PointSymbol3D },
        { default: IconSymbol3DLayer },
        promiseUtils,
        reactiveUtils,
        webMercatorUtils,
      ] = await Promise.all([
        import('@arcgis/core/analysis/ViewshedAnalysis.js'),
        import('@arcgis/core/analysis/Viewshed.js'),
        import('@arcgis/core/geometry/SpatialReference.js'),
        import('@arcgis/core/Graphic.js'),
        import('@arcgis/core/geometry/Point.js'),
        import('@arcgis/core/symbols/PointSymbol3D.js'),
        import('@arcgis/core/symbols/IconSymbol3DLayer.js'),
        import('@arcgis/core/core/promiseUtils.js'),
        import('@arcgis/core/core/reactiveUtils.js'),
        import('@arcgis/core/geometry/support/webMercatorUtils.js'),
      ])

      isAbortErrorRef.current = promiseUtils.isAbortError

      await sceneEl.viewOnReady()
      if (cancelled) return

      const analysis = new ViewshedAnalysis()
      sceneEl.analyses.add(analysis)

      const analysisView = await sceneEl.whenAnalysisView(analysis)

      if (cancelled) {
        sceneEl.analyses.remove(analysis)
        return
      }

      // Convert the building centroid to Web Mercator once so heading/tilt
      // updates don't repeat the projection.
      const [targetX, targetY] = webMercatorUtils.lngLatToXY(
        RADAR_TARGET_LNG_LAT.lng,
        RADAR_TARGET_LNG_LAT.lat,
      )
      const target = { x: targetX, y: targetY, z: RADAR_TARGET_LNG_LAT.z }

      // Seed the analysis with an initial viewshed at the known radar observer
      // position so the user sees an analysis immediately on open.
      // ASSUMPTION(US-25): observer coordinate provided by CAAS in WebMercator
      // (-13046053.890, 4036570.887, z=405.4169 ≈ -117.1947°, 34.0578°).
      const observer = {
        spatialReference: SpatialReference.WebMercator,
        x: -13046053.890,
        y: 4036570.887,
        z: 405.4169,
      }
      const initialAim = aimAtTarget(observer, target)

      const initialViewshed = new Viewshed({
        observer,
        farDistance: initialAim.farDistance,
        tilt: initialAim.tilt,
        heading: initialAim.heading,
        horizontalFieldOfView: 45,
        verticalFieldOfView: 15,
      })
      analysis.viewsheds.add(initialViewshed)
      analysisView.selectedViewshed = initialViewshed
      setViewshedCount(analysis.viewsheds.length)

      // Seed FOV state from the initial viewshed
      setHorizFov(initialViewshed.horizontalFieldOfView)
      setVertFov(initialViewshed.verticalFieldOfView)
      setFarDist(initialAim.farDistance)

      // Prominent sensor marker at the observer location. Sits on top of the
      // analysis's own (small) observer handle and rides above it via callout.
      const sensorSymbol = new PointSymbol3D({
        symbolLayers: [
          new IconSymbol3DLayer({
            resource: { href: SENSOR_ICON_DATA_URI },
            size: 26,
            anchor: 'bottom',
          }),
        ],
        verticalOffset: { screenLength: 16, maxWorldLength: 150, minWorldLength: 8 },
        callout: { type: 'line', size: 1.5, color: [255, 255, 255], border: { color: [0, 0, 0] } },
      })

      const observerGraphic = new Graphic({
        geometry: new Point({
          spatialReference: SpatialReference.WebMercator,
          x: observer.x,
          y: observer.y,
          z: observer.z,
        }),
        symbol: sensorSymbol,
      })
      sceneEl.view.graphics.add(observerGraphic)
      observerGraphicRef.current = observerGraphic

      // Keep the viewshed aimed at the building as the user drags the observer.
      aimHandleRef.current = reactiveUtils.watch(
        (): { x: number; y: number; z: number } | null => {
          const obs = initialViewshed.observer
          return obs ? { x: obs.x, y: obs.y, z: obs.z ?? 0 } : null
        },
        (current) => {
          if (!current) return
          const { heading, tilt, farDistance } = aimAtTarget(current, target)
          initialViewshed.heading = heading
          initialViewshed.tilt = tilt
          initialViewshed.farDistance = farDistance
          if (observerGraphicRef.current) {
            observerGraphicRef.current.geometry = new Point({
              spatialReference: SpatialReference.WebMercator,
              x: current.x,
              y: current.y,
              z: current.z,
            })
          }
        },
      )

      // Sync FOV inputs and observer elevation when the selected viewshed changes
      // or when its properties are modified via the drag handles in the scene.
      // Each primitive watcher avoids the object-reference false-positive problem.
      fovHandlesRef.current.push(
        reactiveUtils.watch(
          () => (analysisView.selectedViewshed as any)?.horizontalFieldOfView as number | undefined,
          (val: number | undefined) => { if (val != null) setHorizFov(val) },
        ),
        reactiveUtils.watch(
          () => (analysisView.selectedViewshed as any)?.verticalFieldOfView as number | undefined,
          (val: number | undefined) => { if (val != null) setVertFov(val) },
        ),
        reactiveUtils.watch(
          () => (analysisView.selectedViewshed as any)?.farDistance as number | undefined,
          (val: number | undefined) => { if (val != null) setFarDist(val) },
        ),
      )

      analysisRef.current = analysis
      analysisViewRef.current = analysisView

      // Keep the placed-count badge in sync as the user adds/removes viewsheds
      changeHandleRef.current = analysis.viewsheds.on('change', () => {
        setViewshedCount(analysis.viewsheds.length)
      })

      setStatus('ready')
    }

    setup().catch(console.error)

    return () => {
      cancelled = true
      abortRef.current?.abort()
      changeHandleRef.current?.remove()
      aimHandleRef.current?.remove()
      fovHandlesRef.current.forEach(h => h.remove())
      fovHandlesRef.current = []
      const analysis = analysisRef.current
      const sceneEl2 = sceneRef.current
      const observerGraphic = observerGraphicRef.current
      if (observerGraphic && sceneEl2?.view?.graphics) {
        try { sceneEl2.view.graphics.remove(observerGraphic) } catch { /* scene torn down */ }
      }
      if (analysis && sceneEl2?.analyses) {
        try { sceneEl2.analyses.remove(analysis) } catch { /* scene torn down */ }
      }
      analysisRef.current = null
      analysisViewRef.current = null
      changeHandleRef.current = null
      aimHandleRef.current = null
      observerGraphicRef.current = null
    }
  }, [sceneRef])

  // ─── Continuous placement loop (mirrors the sample's place() behaviour) ───
  const startPlacing = useCallback(async () => {
    const analysisView = analysisViewRef.current
    if (!analysisView) return

    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const { signal } = abortRef.current

    try {
      while (!signal.aborted) {
        await analysisView.place({ signal })
      }
    } catch (err: unknown) {
      if (isAbortErrorRef.current && !isAbortErrorRef.current(err as Error)) throw err
    } finally {
      if (abortRef.current?.signal === signal) {
        abortRef.current = null
      }
    }
  }, [])

  const stopPlacing = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const handleHorizFovChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    if (isNaN(val)) return
    setHorizFov(val)
    const selected = analysisViewRef.current?.selectedViewshed
    if (selected && val >= 1 && val <= 360) {
      selected.horizontalFieldOfView = val
    }
  }, [])

  const handleVertFovChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    if (isNaN(val)) return
    setVertFov(val)
    const selected = analysisViewRef.current?.selectedViewshed
    if (selected && val >= 1 && val <= 180) {
      selected.verticalFieldOfView = val
    }
  }, [])

  // ─── Single checkbox controls both placement and editing ──────────────────
  const handleInteractiveToggle = useCallback(() => {
    const analysisView = analysisViewRef.current
    if (!analysisView) return

    const next = !isInteractive
    setIsInteractive(next)

    if (next) {
      analysisView.interactive = true
      startPlacing()
    } else {
      stopPlacing()
      analysisView.interactive = false
    }
  }, [isInteractive, startPlacing, stopPlacing])

  // ─── PDF: capture current view as a single-page report ────────────────────
  const generatePDF = useCallback(async () => {
    const sceneEl = sceneRef.current
    if (!sceneEl) return

    setStatus('generating-pdf')
    setPdfProgress('Capturing view…')

    try {
      const { jsPDF } = await import('jspdf')
      const reactiveUtils = await import('@arcgis/core/core/reactiveUtils.js')

      const view = sceneEl.view

      // Let rendering settle before screenshot (tile/mesh updates)
      await Promise.race([
        reactiveUtils.whenOnce(() => !view.updating),
        new Promise<void>((r) => setTimeout(r, 5000)),
      ])

      const shot = await view.takeScreenshot({ format: 'png', quality: 100 })

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const PW = 297
      const PH = 210
      const M = 12
      const dateStr = new Date().toISOString().slice(0, 10)
      const vCount = analysisRef.current?.viewsheds?.length ?? 0

      // ── Header ──────────────────────────────────────────────
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(30, 30, 30)
      doc.text('Radar Viewshed Analysis Report', M, M + 5)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text(dateStr, PW - M, M + 5, { align: 'right' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      doc.text(`${vCount} viewshed${vCount === 1 ? '' : 's'} placed`, M, M + 13)

      // ── Screenshot ─────────────────────────────────────────
      const imgY = M + 18
      const maxImgH = PH - imgY - M
      const rawRatio = shot.data.height / shot.data.width
      const targetW = PW - 2 * M
      const targetH = Math.min(rawRatio * targetW, maxImgH)
      const finalW = targetH < rawRatio * targetW ? targetH / rawRatio : targetW
      doc.addImage(shot.dataUrl, 'PNG', M, imgY, finalW, targetH)

      doc.save(`radar-viewshed-report-${dateStr}.pdf`)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setStatus('ready')
      setPdfProgress('')
    }
  }, [sceneRef])

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Radar Viewshed</span>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close radar viewshed panel">
          ✕
        </button>
      </div>

      {status === 'loading' ? (
        <div className={styles.loading}>Initialising viewshed analysis…</div>
      ) : (
        <>
          <label className={styles.interactiveRow}>
            <input
              type="checkbox"
              checked={isInteractive}
              onChange={handleInteractiveToggle}
              className={styles.interactiveCheck}
            />
            <span className={styles.interactiveLabel}>Edit visible viewsheds</span>
          </label>

          {isInteractive ? (
            <p className={styles.interactiveHint}>
              Click in the scene to place a new viewshed. Drag the handles on a placed
              viewshed to adjust its observer, direction, or cone.
            </p>
          ) : viewshedCount === 0 ? (
            <p className={styles.interactiveHint}>
              Toggle <em>Edit visible viewsheds</em> above, then click in the scene to
              place a viewshed.
            </p>
          ) : null}

          {viewshedCount > 0 && (
            <div className={styles.countBlock}>
              <span className={styles.countLabel}>Placed viewsheds</span>
              <span className={styles.countValue}>{viewshedCount}</span>
            </div>
          )}

          <div className={styles.fovBlock}>
            <div className={styles.fovRow}>
              <label className={styles.fovLabel} htmlFor="radarHorizFov">
                Horizontal FOV
              </label>
              <div className={styles.fovInputGroup}>
                <input
                  id="radarHorizFov"
                  type="number"
                  min={1}
                  max={360}
                  value={horizFov}
                  onChange={handleHorizFovChange}
                  className={styles.fovInput}
                />
                <span className={styles.fovUnit}>°</span>
              </div>
            </div>

            <div className={styles.fovRow}>
              <label className={styles.fovLabel} htmlFor="radarVertFov">
                Vertical FOV
              </label>
              <div className={styles.fovInputGroup}>
                <input
                  id="radarVertFov"
                  type="number"
                  min={1}
                  max={180}
                  value={vertFov}
                  onChange={handleVertFovChange}
                  className={styles.fovInput}
                />
                <span className={styles.fovUnit}>°</span>
              </div>
            </div>

            {farDist > 0 && (
              <div className={styles.fovRow}>
                <span className={styles.fovLabel}>Vertical Height</span>
                <span className={styles.fovValue}>
                  {(farDist * Math.tan((vertFov / 2) * (Math.PI / 180))).toFixed(1)} m
                </span>
              </div>
            )}
          </div>

          <div className={styles.spacer} />

          <div className={styles.footer}>
            {status === 'generating-pdf' ? (
              <div className={styles.pdfProgress}>Generating PDF… {pdfProgress}</div>
            ) : (
              <calcite-button width="full" onClick={generatePDF}>
                Generate PDF Report
              </calcite-button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
