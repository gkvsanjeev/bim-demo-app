import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import '@arcgis/map-components/components/arcgis-scene'
import '@arcgis/map-components/components/arcgis-zoom'
import '@arcgis/map-components/components/arcgis-navigation-toggle'
import '@arcgis/map-components/components/arcgis-compass'
import '@arcgis/map-components/components/arcgis-building-explorer'
import '@arcgis/map-components/components/arcgis-basemap-gallery'
import '@arcgis/map-components/components/arcgis-layer-list'
import '@arcgis/map-components/components/arcgis-legend'
import { AppHeader } from './features/map-viewer/AppHeader'
import { RightToolbar } from './features/map-viewer/RightToolbar'
import { CoordinateConversionTool } from './features/map-viewer/CoordinateConversionTool'

// Header height must stay in sync with AppHeader.module.css .header height
const HEADER_H = 50
// Icon strip width must stay in sync with RightToolbar.module.css .iconStrip width
const ICON_STRIP_W = 44

function App() {
  const { applicationId = '' } = useParams<{ applicationId: string }>()
  const sceneRef = useRef<any>(null) // FIXME(arcgis): arcgis-scene element type not exported
  const [isBasemapOpen, setIsBasemapOpen] = useState(false)
  const [isBuildingExplorerOpen, setIsBuildingExplorerOpen] = useState(true)
  const [isCoordinatesOpen, setIsCoordinatesOpen] = useState(false)

  useEffect(() => {
    const sceneEl = sceneRef.current
    if (!sceneEl) return

    const setup = async () => {
      const view = await sceneEl.viewOnReady()

      // view.ui.padding offsets ALL slot/ui widgets so they don't sit behind our
      // fixed AppHeader (top) or the RightToolbar icon strip (right).
      try {
        if (view?.ui) {
          view.ui.padding = { top: HEADER_H, right: ICON_STRIP_W }
        }
      } catch {
        // Silently ignore — padding enhancement only, does not affect core functionality
      }

      sceneEl.map.allLayers.forEach((layer: any) => {
        if (layer.title === 'Esri Building E Demo') {
          const buildingExplorer = document.querySelector('arcgis-building-explorer') as any
          if (buildingExplorer) {
            buildingExplorer.layers = [layer]
          }
        }
      })
    }

    setup().catch(console.error)
  }, [])

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <arcgis-scene
        ref={sceneRef}
        item-id="f477c289e93347aba6a0c052bfe0e0a4"
        style={{ height: '100%', width: '100%', display: 'block' }}
      >
        <arcgis-zoom slot="top-left" style={{ marginTop: '50px' }} />
        <arcgis-navigation-toggle slot="top-left" />
        <arcgis-compass slot="top-left" />
        {/*
          marginRight keeps the building explorer clear of the 44px RightToolbar icon strip.
          view.ui.padding (set above) handles this for view.ui-registered widgets,
          but slot-positioned widgets need the explicit margin offset.
        */}
        {/* Always mounted so the one-time layer assignment in useEffect survives toggle; visibility controlled via display */}
        <arcgis-building-explorer
          slot="bottom-right"
          style={{
            marginRight: `${ICON_STRIP_W}px`,
            display: isBuildingExplorerOpen ? undefined : 'none',
          }}
        />
        {/*
          Gallery must be a child of arcgis-scene so it auto-discovers the SceneView
          and filters to 3D-compatible basemaps. Setting view externally only gives a
          ViewProxy reference which loses SceneView type context.
        */}
        {isBasemapOpen && (
          <arcgis-basemap-gallery
            slot="top-right"
            style={{
              marginTop: `${HEADER_H}px`,
              marginRight: `${ICON_STRIP_W}px`,
            }}
          />
        )}
        {/*
          Coordinate-conversion widget must be a *direct* DOM child of arcgis-scene
          for the slot="bottom-left" attribute to take effect. The component renders
          only the web element (no wrapping div), preserving the slot binding.
        */}
        {isCoordinatesOpen && <CoordinateConversionTool />}
      </arcgis-scene>
      <AppHeader applicationId={applicationId} />
      <RightToolbar
        sceneRef={sceneRef}
        isBasemapOpen={isBasemapOpen}
        onBasemapToggle={() => setIsBasemapOpen((prev) => !prev)}
        isBuildingExplorerOpen={isBuildingExplorerOpen}
        onBuildingExplorerToggle={() => setIsBuildingExplorerOpen((prev) => !prev)}
        isCoordinatesOpen={isCoordinatesOpen}
        onCoordinatesToggle={() => setIsCoordinatesOpen((prev) => !prev)}
      />
    </div>
  )
}

export default App
