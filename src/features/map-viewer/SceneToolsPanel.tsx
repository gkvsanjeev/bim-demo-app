import '@esri/calcite-components/components/calcite-icon'
import '@esri/calcite-components/components/calcite-button'
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './SceneToolsPanel.module.css'

interface ToolEntry {
  name: string
  icon: string
  analysis: any // FIXME(arcgis): no public TS type for ArcGIS analysis objects yet
  analysisView: any // FIXME(arcgis): no public TS type for ArcGIS analysis views yet
}

interface SceneToolsPanelProps {
  sceneRef: React.RefObject<any> // FIXME(arcgis): arcgis-scene element type not exported
  onClose: () => void
}

function checkPresent(analysis: any): boolean { // FIXME(arcgis): typed above
  if (!analysis) return false
  switch (analysis.type) {
    case 'direct-line-measurement':
      return analysis.startPoint !== null && analysis.endPoint !== null
    case 'area-measurement':
      return analysis.geometry !== null
    case 'line-of-sight':
      return analysis.observer !== null
    case 'slice':
      return analysis.shape !== null
    case 'viewshed':
      return (analysis.viewsheds?.length ?? 0) > 0
    case 'dimension':
      return (analysis.dimensions?.length ?? 0) > 0
    default:
      return false
  }
}

function clearData(analysis: any): void { // FIXME(arcgis): typed above
  if (!analysis) return
  switch (analysis.type) {
    case 'direct-line-measurement':
      analysis.startPoint = null
      analysis.endPoint = null
      break
    case 'area-measurement':
      analysis.geometry = null
      break
    case 'line-of-sight':
      analysis.observer = null
      analysis.targets = []
      break
    case 'slice':
      analysis.shape = null
      break
    case 'viewshed':
      analysis.viewsheds = []
      break
    case 'dimension':
      analysis.dimensions = []
      break
  }
}

export function SceneToolsPanel({ sceneRef, onClose }: SceneToolsPanelProps) {
  const [tools, setTools] = useState<ToolEntry[]>([])
  const [activeToolName, setActiveToolName] = useState<string | null>(null)
  const [showClear, setShowClear] = useState(false)
  const [showSelectionHint, setShowSelectionHint] = useState(false)

  const activeToolRef = useRef<ToolEntry | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const isAbortErrorRef = useRef<((err: Error) => boolean) | null>(null)

  const refreshClearState = useCallback(() => {
    const analysis = activeToolRef.current?.analysis
    const present = checkPresent(analysis)
    setShowClear(present)
    setShowSelectionHint(
      present && (analysis?.type === 'viewshed' || analysis?.type === 'dimension'),
    )
  }, [])

  const placeContinuous = useCallback(async () => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const { signal } = abortRef.current
    try {
      while (!signal.aborted) {
        await activeToolRef.current!.analysisView.place({ signal })
        refreshClearState()
      }
    } catch (err: unknown) {
      if (isAbortErrorRef.current && !isAbortErrorRef.current(err as Error)) throw err
    } finally {
      if (abortRef.current?.signal === signal) {
        abortRef.current = null
      }
    }
  }, [refreshClearState])

  const stopActiveTool = useCallback(() => {
    if (activeToolRef.current) {
      abortRef.current?.abort()
      activeToolRef.current.analysisView.interactive = false
      activeToolRef.current = null
    }
    setActiveToolName(null)
    setShowClear(false)
    setShowSelectionHint(false)
  }, [])

  const onToolClick = useCallback(
    (tool: ToolEntry) => {
      if (activeToolRef.current?.name === tool.name) {
        stopActiveTool()
      } else {
        stopActiveTool()
        activeToolRef.current = tool
        setActiveToolName(tool.name)
        placeContinuous()
      }
    },
    [stopActiveTool, placeContinuous],
  )

  const onClearClick = useCallback(() => {
    clearData(activeToolRef.current?.analysis)
    setShowClear(false)
    setShowSelectionHint(false)
  }, [])

  const handleClose = useCallback(() => {
    stopActiveTool()
    onClose()
  }, [stopActiveTool, onClose])

  useEffect(() => {
    const sceneEl = sceneRef.current
    if (!sceneEl) return

    let cancelled = false

    const setup = async () => {
      const [
        { default: AreaMeasurementAnalysis },
        { default: DirectLineMeasurementAnalysis },
        { default: LineOfSightAnalysis },
        { default: ViewshedAnalysis },
        { default: DimensionAnalysis },
        { default: SliceAnalysis },
        promiseUtilsMod,
      ] = await Promise.all([
        import('@arcgis/core/analysis/AreaMeasurementAnalysis.js'),
        import('@arcgis/core/analysis/DirectLineMeasurementAnalysis.js'),
        import('@arcgis/core/analysis/LineOfSightAnalysis.js'),
        import('@arcgis/core/analysis/ViewshedAnalysis.js'),
        import('@arcgis/core/analysis/DimensionAnalysis.js'),
        import('@arcgis/core/analysis/SliceAnalysis.js'),
        import('@arcgis/core/core/promiseUtils.js'),
      ])

      isAbortErrorRef.current = promiseUtilsMod.isAbortError

      const builtTools: ToolEntry[] = [
        { name: 'Area Measurement', icon: 'measure-area', analysis: new AreaMeasurementAnalysis(), analysisView: null },
        { name: 'Direct Line Measurement', icon: 'measure-line', analysis: new DirectLineMeasurementAnalysis(), analysisView: null },
        { name: 'Line of Sight', icon: 'line-of-sight', analysis: new LineOfSightAnalysis(), analysisView: null },
        { name: 'Viewshed', icon: 'viewshed', analysis: new ViewshedAnalysis(), analysisView: null },
        { name: 'Dimension', icon: 'dimensions', analysis: new DimensionAnalysis(), analysisView: null },
        { name: 'Slice', icon: 'slice', analysis: new SliceAnalysis(), analysisView: null },
      ]

      await sceneEl.viewOnReady()
      if (cancelled) return

      await Promise.all(
        builtTools.map(async (tool) => {
          sceneEl.analyses.add(tool.analysis)
          tool.analysisView = await sceneEl.whenAnalysisView(tool.analysis)
        }),
      )

      setTools(builtTools)
    }

    setup().catch(console.error)
    return () => {
      cancelled = true
    }
  }, [sceneRef])

  useEffect(() => {
    const sceneEl = sceneRef.current
    if (!sceneEl || tools.length === 0) return

    const onKeyDown = (e: Event) => {
      if ((e as CustomEvent).detail?.key === 'Escape') stopActiveTool()
    }
    sceneEl.addEventListener('arcgisViewKeyDown', onKeyDown)
    return () => sceneEl.removeEventListener('arcgisViewKeyDown', onKeyDown)
  }, [tools, sceneRef, stopActiveTool])

  const activeTool = tools.find((t) => t.name === activeToolName) ?? null

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Analysis objects</span>
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Close analysis panel">
          ✕
        </button>
      </div>

      {tools.length === 0 ? (
        <div className={styles.loading}>Loading analysis tools…</div>
      ) : (
        <>
          <div className={styles.iconRow}>
            {tools.map((tool) => (
              <button
                key={tool.name}
                className={`${styles.toolIconBtn} ${activeToolName === tool.name ? styles.toolIconBtnActive : ''}`}
                onClick={() => onToolClick(tool)}
                title={tool.name}
                aria-pressed={activeToolName === tool.name}
              >
                <calcite-icon icon={tool.icon} scale="s" />
              </button>
            ))}
          </div>

          <div className={styles.body}>
            {activeTool ? (
              <>
                <p className={styles.prompt}>
                  Click in view to start placing{' '}
                  <strong>{activeTool.analysis.type.replace(/-/g, ' ')}</strong> analysis.
                </p>
                {showSelectionHint && (
                  <p className={styles.hint}>
                    <em>
                      To edit an existing analysis, select it by hovering and clicking on its
                      manipulator(s).
                    </em>
                  </p>
                )}
                <div className={styles.buttons}>
                  {showClear && (
                    <calcite-button
                      appearance="outline-fill"
                      kind="neutral"
                      width="full"
                      onClick={onClearClick}
                    >
                      Clear
                    </calcite-button>
                  )}
                  <calcite-button width="full" onClick={stopActiveTool}>
                    Done
                  </calcite-button>
                </div>
              </>
            ) : (
              <p className={styles.idle}>Choose an analysis type above.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
