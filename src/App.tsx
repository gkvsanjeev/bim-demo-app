import { useEffect, useRef } from 'react'
import '@arcgis/map-components/components/arcgis-scene'
import '@arcgis/map-components/components/arcgis-zoom'
import '@arcgis/map-components/components/arcgis-navigation-toggle'
import '@arcgis/map-components/components/arcgis-compass'
import '@arcgis/map-components/components/arcgis-building-explorer'

function App() {
  const sceneRef = useRef<any>(null)

  useEffect(() => {
    const sceneEl = sceneRef.current
    if (!sceneEl) return

    const setup = async () => {
      await sceneEl.viewOnReady()
      sceneEl.map.allLayers.forEach((layer: any) => {
        if (layer.title === 'Esri Building E Demo') {
          const buildingExplorer = document.querySelector('arcgis-building-explorer') as any
          if (buildingExplorer) {
            buildingExplorer.layers = [layer]
          }
        }
      })
    }

    setup()
  }, [])

  return (
    <arcgis-scene
      ref={sceneRef}
      item-id="f477c289e93347aba6a0c052bfe0e0a4"
      style={{ height: '100vh', width: '100vw', display: 'block' }}
    >
      <arcgis-zoom slot="top-left" />
      <arcgis-navigation-toggle slot="top-left" />
      <arcgis-compass slot="top-left" />
      <arcgis-building-explorer slot="top-right" />
    </arcgis-scene>
  )
}

export default App
